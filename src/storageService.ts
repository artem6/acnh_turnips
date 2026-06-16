interface StorageItem {
  expiration: number;
  value: any;
}

interface DataStore {
  [prop: string]: StorageItem;
}

let memoryStore: DataStore = {};

const USE_LOCAL_STORE = typeof localStorage !== "undefined";
const LOCAL_STORE_KEY = "MONETFE_DATA_STORE";
const VALUE_EXPIRATION = 14 * 24 * 60 * 60 * 1000;
const EXPIRATION_CHECK_INTERVAL = 60 * 60 * 1000;

let lastExpirationCheck = 0;
function checkForExpired() {
  if (Date.now() < lastExpirationCheck + EXPIRATION_CHECK_INTERVAL) return;
  const store = getStore();
  Object.keys(store).forEach(key => {
    if (store[key].expiration < Date.now()) delete store[key];
  });
  setStore(store);
  lastExpirationCheck = Date.now();
}

function getStore(): DataStore {
  if (USE_LOCAL_STORE) {
    const dataStr = localStorage.getItem(LOCAL_STORE_KEY);
    if (dataStr) return JSON.parse(dataStr);
  }
  return memoryStore;
}

function setStore(value: DataStore) {
  memoryStore = value;
  if (USE_LOCAL_STORE) {
    localStorage.setItem(LOCAL_STORE_KEY, JSON.stringify(value));
  }
}

function set(key: string, value: any, expiration = VALUE_EXPIRATION) {
  const store = getStore();
  store[key] = {
    expiration: Date.now() + expiration,
    value
  };
  setStore(store);
  return value;
}

function get(key: string) {
  const data = getStore()[key];
  if (!data) return;
  if (data.expiration < Date.now()) return clear(key);
  return data.value;
}

function clear(key: string) {
  const data = getStore();
  delete data[key];
  setStore(data);
}

export { set, get, clear, checkForExpired };
