import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useProductStore = defineStore('product', () => {
  const allProducts = ref([])
  const page = ref(0)
  const loading = ref(false)
  const hasMore = ref(true)

  async function loadMore(pageSize = 60) {
    if (loading.value || !hasMore.value) return
    loading.value = true

    try {
      const res = await fetch(
        `/api/products?page=${page.value}&pageSize=${pageSize}`
      )
      const list = await res.json()
      page.value += 1

      if (!list || list.length === 0) {
        hasMore.value = false
      } else {
        allProducts.value.push(...list)
      }
    } finally {
      loading.value = false
    }
  }

  function reset() {
    allProducts.value = []
    page.value = 0
    loading.value = false
    hasMore.value = true
  }

  return { allProducts, page, loading, hasMore, loadMore, reset }
})