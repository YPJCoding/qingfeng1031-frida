// ============================================================================
// DNF Frida modern modular package - itemSearch.js
// 道具名称列表加载及模糊/精确搜索，供 GM 命令使用。
// ============================================================================

// 道具名称列表
// ============================================================================

let g_itemNameList = null

function ensureItemNameListLoaded() {
  if (g_itemNameList) return
  try {
    const f = new File('/data/frida/data/item_name_list.txt', 'r')
    g_itemNameList = []
    let count = 0
    while (count < 50000) {
      const line = f.readLine()
      if (!line) break
      const p = line.indexOf('----')
      if (p < 0) continue
      g_itemNameList.push({ id: line.slice(0, p), name: line.slice(p + 4) })
      count++
    }
    f.close()
  } catch (e) {
    g_itemNameList = []
  }
}

// 搜索函数
// ============================================================================

function searchItemsByName(keyword) {
  ensureItemNameListLoaded()
  if (!g_itemNameList || g_itemNameList.length === 0) return []
  const kw = keyword.toLowerCase()
  const matches = []
  for (let i = 0; i < g_itemNameList.length; i++) {
    if (g_itemNameList[i].name.toLowerCase().includes(kw)) {
      matches.push(g_itemNameList[i])
      if (matches.length >= 20) break
    }
  }
  return matches
}

function searchItemsByFullName(name) {
  ensureItemNameListLoaded()
  if (!g_itemNameList || g_itemNameList.length === 0) return []
  const n = name.toLowerCase()
  const matches = []
  for (let i = 0; i < g_itemNameList.length; i++) {
    if (g_itemNameList[i].name.toLowerCase() === n) {
      matches.push(g_itemNameList[i])
    }
  }
  return matches
}

// ============================================================================

if (!globalThis.dnfPlugin) { globalThis.dnfPlugin = {} }
__dnfExport({ ensureItemNameListLoaded, searchItemsByName, searchItemsByFullName })
