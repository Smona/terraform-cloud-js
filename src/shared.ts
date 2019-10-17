import axios  from "axios";

const store = {
  api: createAPI(''),
  token: '',
}

export default {
  get api() {
    if (!store.token) {
      throw new Error('API not configured. You must call configure() before using the sdk.')
    }
    return store.api;
  },
  set api(api) {
    console.warn('api is read-only')
  },
  get token() {
    return store.token;
  },
  set token(token: string) {
    store.token = token
    store.api = createAPI(token)
  },
}

function createAPI(token: string) {
  return axios.create({
    baseURL: 'https://app.terraform.io/api/v2/',
    headers: {
      'Content-Type': 'application/vnd.api+json',
      Authorization: `Bearer ${token}`,
    },
  });
}