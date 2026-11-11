<!-- 分数线设置 + 高分段校准 + 985/211 参考线 -->
<template>
  <section class="card">
    <div class="card-head">
      <div>
        <h2>分数线设置</h2>
        <p>学校预估线填学校公布的批次线，省控线填对应年份的省批次线。</p>
      </div>
      <div class="seg" role="tablist" aria-label="科类">
        <button
          v-for="key in ctx.SUBJECTS"
          :key="key"
          type="button"
          role="tab"
          :aria-selected="ctx.state.subject === key"
          :class="{ active: ctx.state.subject === key }"
          @click="ctx.state.subject = key"
        >{{ ctx.SUBJECT_LABELS[key] }}</button>
      </div>
    </div>

    <p v-if="!ctx.validRule" class="warn">分数线顺序不正确：需要满足「学校特控线 &gt; 本科线 &gt; 专科线」，且都在 0–750 之间。</p>

    <div class="line-grid">
      <LineFieldset
        v-for="line in ctx.lineFields"
        :key="line.key"
        :label="ctx.LINE_LABELS[line.key]"
        :curr-key="line.curr"
        :last-key="line.last"
        :rule="ctx.currentRule"
        :diff="ctx.diffs[line.key]"
      />
    </div>

    <div class="actions">
      <button type="button" class="ghost" @click="ctx.resetRule">恢复默认（广东 2026）</button>
      <span class="saved-hint">改动会自动保存在本机</span>
    </div>

    <div class="anchor-box">
      <div class="anchor-head">
        <strong>高分段校准（可选）</strong>
        <span>不填则特控线以上统一使用特控线线差</span>
      </div>
      <p class="anchor-desc">按交接文档：如果特控线以上的换算整体偏高或偏低，可用「本次最高分 → 往年同一位次分数」再校准一次。</p>
      <div class="anchor-inputs">
        <NumberField v-model="ctx.state.topAnchors[ctx.state.subject].maxScore" label="本次考试最高分" placeholder="例如 640" />
        <NumberField v-model="ctx.state.topAnchors[ctx.state.subject].targetMaxScore" label="往年同一位次对应分数" placeholder="例如 650" />
      </div>
      <p class="anchor-desc" style="margin-top: 16px;">
        <strong>985 / 211 参考线（可选，分科类）</strong>：按往年院校最低录取分判断。
        <template v-if="ctx.state.subject === 'physics'">物理 985 用<strong>中山大学</strong>、211 用<strong>暨南大学</strong>；</template>
        <template v-else>历史 985 用<strong>华南理工</strong>、211 用<strong>暨南大学</strong>；</template>
        换算分达到即标层次，不填则不判断。
      </p>
      <div class="anchor-inputs">
        <NumberField
          v-model="ctx.state.tierLines[ctx.state.subject].s985"
          :label="`985 参考线（${ctx.state.subject === 'physics' ? '中山大学' : '华南理工'}）`"
          placeholder="往年最低录取分"
        />
        <NumberField v-model="ctx.state.tierLines[ctx.state.subject].s211" label="211 参考线（暨南大学）" placeholder="往年最低录取分" />
      </div>

      <p v-if="ctx.topAnchorActive" class="anchor-note">
        最高分线差 {{ ctx.fmt(ctx.topAnchorDiff) }}，特控线（{{ ctx.fmt(ctx.currentRule.currTk) }} 分）到最高分（{{ ctx.fmt(ctx.state.topAnchors[ctx.state.subject].maxScore) }} 分）之间按这个线差线性过渡。
      </p>
    </div>
  </section>
</template>

<script setup>
import { inject } from 'vue'
import { SCORE_CONVERTER_KEY } from './constants.js'
import LineFieldset from './LineFieldset.vue'
import NumberField from './NumberField.vue'

const ctx = inject(SCORE_CONVERTER_KEY)
</script>
