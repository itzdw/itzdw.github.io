/**
 * 前端八股文工作台 · 客户端状态持久化层
 *
 * 设计原则（遵循 web-client-state-persistence 的 Core Pattern）：
 * 1. 存储后端与业务状态解耦：现在用 localStorage，未来可替换为 IndexedDB / 服务端 DB。
 * 2. 所有接口异步（Promise），业务代码无需感知后端是同步还是异步。
 * 3. 按命名 scope 隔离：progress / prefs / session / review，避免互相污染。
 * 4. save 采用 patch 合并语义，字段设为 undefined 表示删除该字段。
 *
 * 迁移到数据库：实现 StorageBackend 的 get/set/remove/keys，注入 StateStore 即可，
 * 例如 new BaguwenStateStore(new ServerDBBackend({ endpoint: '/api/state' }))。
 */
(function (root) {
  'use strict';

  const PREFIX = 'baguwen:v1:';

  class StorageBackend {
    async get(scope) { throw new Error('get() not implemented'); }
    async set(scope, data) { throw new Error('set() not implemented'); }
    async remove(scope) { throw new Error('remove() not implemented'); }
    async keys() { return []; }
  }

  class LocalStorageBackend extends StorageBackend {
    async get(scope) {
      try {
        const raw = root.localStorage.getItem(scope);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        console.warn('[StateStore] get failed', e);
        return null;
      }
    }
    async set(scope, data) {
      try {
        root.localStorage.setItem(scope, JSON.stringify(data));
        return true;
      } catch (e) {
        console.warn('[StateStore] set failed', e);
        return false;
      }
    }
    async remove(scope) {
      try { root.localStorage.removeItem(scope); return true; }
      catch (e) { console.warn('[StateStore] remove failed', e); return false; }
    }
    async keys() {
      try {
        const out = [];
        for (let i = 0; i < root.localStorage.length; i++) {
          const k = root.localStorage.key(i);
          if (k && k.indexOf(PREFIX) === 0) out.push(k);
        }
        return out;
      } catch (e) { return []; }
    }
  }

  /** 隐私模式 / localStorage 被禁用时的内存降级，保证应用不崩。 */
  class MemoryBackend extends StorageBackend {
    constructor() { super(); this.map = new Map(); }
    async get(scope) { return this.map.has(scope) ? this.map.get(scope) : null; }
    async set(scope, data) { this.map.set(scope, data); return true; }
    async remove(scope) { this.map.delete(scope); return true; }
    async keys() { return Array.from(this.map.keys()); }
  }

  function pickBackend() {
    try {
      const probe = PREFIX + '__probe__';
      root.localStorage.setItem(probe, '1');
      root.localStorage.removeItem(probe);
      return new LocalStorageBackend();
    } catch (e) {
      console.warn('[StateStore] localStorage unavailable, fallback to memory');
      return new MemoryBackend();
    }
  }

  class StateStore {
    constructor(backend) {
      this.backend = backend || pickBackend();
    }
    key(scope) { return PREFIX + scope; }
    async load(scope) {
      return await this.backend.get(this.key(scope));
    }
    async save(scope, patch) {
      const key = this.key(scope);
      const existing = (await this.backend.get(key)) || {};
      const next = Object.assign({}, existing, patch);
      Object.keys(next).forEach(k => next[k] === undefined && delete next[k]);
      await this.backend.set(key, next);
      return next;
    }
    async remove(scope) {
      return await this.backend.remove(this.key(scope));
    }
    /** 清空本应用的全部状态（保留其它站点数据）。 */
    async clear() {
      const keys = await this.backend.keys();
      for (const k of keys) await this.backend.remove(k);
      return true;
    }
    /** 导出全部状态，用于备份 / 跨设备迁移。 */
    async exportAll() {
      const keys = await this.backend.keys();
      const out = {};
      for (const k of keys) out[k] = await this.backend.get(k);
      return { version: 1, exportedAt: new Date().toISOString(), data: out };
    }
    async importAll(payload) {
      if (!payload || !payload.data) throw new Error('invalid backup');
      for (const [k, v] of Object.entries(payload.data)) {
        if (k.indexOf(PREFIX) === 0) await this.backend.set(k, v);
      }
      return true;
    }
  }

  root.BaguwenStorageBackend = StorageBackend;
  root.BaguwenLocalStorageBackend = LocalStorageBackend;
  root.BaguwenMemoryBackend = MemoryBackend;
  root.BaguwenStateStore = StateStore;
})(typeof window !== 'undefined' ? window : globalThis);
