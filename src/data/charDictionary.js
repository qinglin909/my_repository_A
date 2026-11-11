// 繁简字源解析字典。原先 CharacterView.vue 与 CharacterExplainer.vue
// 各存了一份完全相同的副本，这里收成唯一数据源。

export const CHAR_DICTIONARY = {
  '爱': {
    char: '爱', traditional: '愛', radical: '爫', strokes: 10, structure: '上下结构',
    decomposition: '上为「爫」（爪），中为「冖」（覆盖），下为「心」与「夂」。',
    evolution: '「愛」在甲骨文和金文中，形似一个人双手捧心，表示内心深处的感情。小篆定型为「旡」在「心」上，后加「夂」表示行走，意为感情在心里流淌。',
    originalMeaning: '深厚的感情、喜爱。',
    extendedMeaning: '引申为对人或事物有深挚的感情；也指容易发生某种变化（如：铁爱生锈）。',
    pronunciation: '读音：ài。',
    diffNote: '简体字「爱」将中间的「心」变成了「友」的省形，但保留了「爫」和「冖」。注意：简体「爱」失去了「心」的意象，但在传统造字中，「爱」是必须用「心」的。'
  },
  '后': {
    char: '后', traditional: '後', radical: '口', strokes: 6, structure: '半包围结构',
    decomposition: '「后」上部为「厂」形（或说为「人」的变形），下部为「口」。',
    evolution: '「后」在甲骨文中像一个妇女生孩子，本义就是女性首领（如：王后）。后来简化时，把表示时间/方位的「後」（从彳，表示行走）合并到了「后」字中。',
    originalMeaning: '君主、帝王的正妻（如：皇后）。',
    extendedMeaning: '后被借用表示“时间在后的”、“方位在后的”（如：后天、后面），这一含义原本属于「後」字。',
    pronunciation: '读音：hòu。',
    diffNote: '【极易错】在古代，表示“君主妻子”只能用「后」（如：皇后）；表示“先后”只能用「後」（如：後來）。简体字统用「后」，但当你写繁体文时，绝不能把“皇后”写成“皇後”。'
  },
  '发': {
    char: '发', traditional: '發 / 髮', radical: '又 / 髟', strokes: 5, structure: '独体字',
    decomposition: '简体「发」是一个简化符号，无法直接拆解。繁体「發」上为「癶」（两足），下为「弓」「殳」。繁体「髮」上为「髟」（长发），下为「拔」音。',
    evolution: '「發」表示拉弓射箭，引申为出发、发生。「髮」在甲骨文中像人的头发飘逸。',
    originalMeaning: '发送、发射（發）；人的头发（髮）。',
    extendedMeaning: '引申为发生、发展、发达（發）；也指毛发相关（髮）。',
    pronunciation: '读音：fā（发出）；fà（头发）。',
    diffNote: '【简繁同形不同义】简体一个「发」，对应两个完全不同的繁体字。「发送」对应「發」；「头发」对应「髮」。写繁体时如果写“头發”就是错的。'
  },
  '干': {
    char: '干', traditional: '乾 / 幹 / 干', radical: '干', strokes: 3, structure: '独体字',
    decomposition: '甲骨文「干」像带有丫杈的木棍，是古代武器。繁体「乾」从乙、倝声；「幹」从木、倝声。',
    evolution: '「干」本义是盾牌（如：大动干戈）。后来被借用作多个繁体字的简化字。',
    originalMeaning: '盾牌，引申为触犯、干涉。',
    extendedMeaning: '（乾）表示干燥、干枯（如：乾燥）。（幹）表示树干、做事（如：幹活）。',
    pronunciation: '读音：gān（干燥、干涉）；gàn（干活）。',
    diffNote: '【三个字合并】干燥的「乾」（gān）、干活的「幹」（gàn）、干涉的「干」（gān），在简化字中全部合并为「干」。'
  }
}

/** 未收录的字：返回与两个旧组件完全一致的兜底条目 */
export function emptyCharEntry(char) {
  return {
    char,
    traditional: '暂无收录',
    radical: '未知',
    strokes: '-',
    structure: '未知',
    decomposition: '该字的高级字源数据暂未录入本地库。',
    evolution: '暂无字源演变信息。',
    originalMeaning: '暂无解析。',
    extendedMeaning: '暂无解析。',
    pronunciation: '暂无解析。',
    diffNote: '暂无繁简差异说明。如需完整字典库，建议后期接入“汉典”或“国学大师”API。'
  }
}

export function lookupChar(char) {
  return CHAR_DICTIONARY[char] || emptyCharEntry(char)
}
