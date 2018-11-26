export default {
  set(name, value) {
    localStorage.setItem(name, value)
  },
  get(name) {
    return localStorage.getItem(name)
  },
  remove(name) {
    localStorage.removeItem(name)
  }
}
