<template>
  <PawBottomSheet
    v-model="valueProxy"
    variant="date-picker"
    height="85vh"
    :close-on-mask="true"
    :safe-area="true"
    :z-index="10040"
  >
    <view
      class="paw-date-picker-sheet"
      :data-qa="qa"
    >
      <view class="paw-date-picker-sheet__calendar">
        <view class="paw-date-picker-sheet__weekdays">
          <text
            v-for="weekday in weekdays"
            :key="weekday"
            class="paw-date-picker-sheet__weekday"
            >{{ weekday }}</text
          >
        </view>

        <scroll-view
          class="paw-date-picker-sheet__calendar-scroll"
          data-qa="qa-feeding-calendar-date-scroll"
          scroll-y
          :show-scrollbar="false"
          :bounces="false"
          :scroll-into-view="calendarScrollIntoView"
          @scrolltoupper="loadPreviousMonths"
          @scrolltolower="loadNextMonths"
        >
          <view class="paw-date-picker-sheet__months">
            <view
              v-for="month in calendarMonths"
              :id="monthAnchorId(month.key)"
              :key="month.key"
              class="paw-date-picker-sheet__month"
            >
              <text class="paw-date-picker-sheet__month-title">{{ month.label }}</text>
              <view class="paw-date-picker-sheet__grid">
                <view
                  v-for="cell in month.cells"
                  :key="cell.date"
                  class="paw-date-picker-sheet__cell"
                  :class="{
                    'paw-date-picker-sheet__cell--muted': cell.muted,
                    'paw-date-picker-sheet__cell--today': cell.date === todayDate,
                    'paw-date-picker-sheet__cell--selected':
                      cell.date === normalizedSelectedDate && cell.date !== todayDate,
                    'paw-date-picker-sheet__cell--disabled': cell.disabled,
                  }"
                  :data-date="cell.date"
                  data-qa="qa-feeding-calendar-date"
                  @tap.stop="selectDate(cell.date)"
                >
                  <view
                    class="paw-date-picker-sheet__day"
                    :class="[
                      `paw-date-picker-sheet__day--${cell.tone}`,
                      { 'paw-date-picker-sheet__day--marked': cell.count > 0 },
                    ]"
                  >
                    <text>{{ cell.day }}</text>
                    <text
                      v-if="cell.count > 0"
                      class="paw-date-picker-sheet__count"
                      >{{ cell.count }}/{{ cell.total || cell.count }}</text
                    >
                  </view>
                </view>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>

      <view class="paw-date-picker-sheet__feedback">
        <text class="paw-date-picker-sheet__feedback-date">{{ selectedDateLabel }}</text>
        <scroll-view
          class="paw-date-picker-sheet__feedback-scroll"
          data-qa="qa-feeding-calendar-feedback-scroll"
          scroll-y
          :show-scrollbar="false"
          :bounces="false"
        >
          <view
            v-if="selectedEntries.length"
            class="paw-date-picker-sheet__feedback-list"
          >
            <view
              v-for="(entry, index) in selectedEntries"
              :key="`${entry.date}-${index}-${entry.label || ''}`"
              class="paw-date-picker-sheet__feedback-row"
            >
              <view
                class="paw-date-picker-sheet__feedback-dot"
                :class="`paw-date-picker-sheet__feedback-dot--${entry.tone || 'orange'}`"
              ></view>
              <text class="paw-date-picker-sheet__feedback-copy">{{
                entry.label || fallbackLabel
              }}</text>
            </view>
          </view>
          <text
            v-else
            class="paw-date-picker-sheet__feedback-empty"
            >{{ emptyText }}</text
          >
        </scroll-view>
      </view>
    </view>
  </PawBottomSheet>
</template>

<script lang="ts">
import { eventContract } from '@/utils/componentEvents.ts'

import { defineComponent, type PropType } from 'vue'

import PawBottomSheet from '@/components/overlay/PawBottomSheet.vue'

export type PawDatePickerMode = 'total' | 'pet'
export type PawDatePickerTone = 'green' | 'red' | 'orange' | 'blue' | 'gray'

export type PawDatePickerMonthLoader = (
  // eslint-disable-next-line no-unused-vars
  ...args: [string]
) =>
  | PawDatePickerEntry[]
  | readonly PawDatePickerEntry[]
  | Promise<PawDatePickerEntry[] | readonly PawDatePickerEntry[] | void>
  | void

export interface PawDatePickerEntry {
  id?: string
  date: string
  count?: number
  total?: number
  label?: string
  tone?: PawDatePickerTone
}

interface PawDateCell {
  date: string
  day: number
  muted: boolean
  disabled: boolean
  count: number
  total: number
  tone: PawDatePickerTone | ''
}

interface PawDateMonth {
  key: string
  label: string
  cells: PawDateCell[]
}

interface PawDatePickerSheetState {
  viewDate: string
  loadedMonthKeys: string[]
  loadedEntries: PawDatePickerEntry[]
  monthEntriesCache: Record<string, PawDatePickerEntry[]>
  requestedMonthKeys: string[]
  loadingMonthKeys: string[]
  calendarScrollIntoView: string
}

const DEFAULT_HISTORY_MONTHS = 12
const MONTH_LOAD_BATCH = 2

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function formatDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function parseDate(value: string): Date | null {
  const match = String(value || '').match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (!match) return null
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return Number.isNaN(date.getTime()) ? null : date
}

function monthStart(value: string): Date {
  const parsed = parseDate(value)
  if (parsed) return new Date(parsed.getFullYear(), parsed.getMonth(), 1)
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

function monthKey(value: string | Date): string {
  const date = value instanceof Date ? value : parseDate(value)
  if (!date) return ''
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`
}

function normalizeDate(value: string): string {
  const date = parseDate(value)
  return date ? formatDate(date) : ''
}

function dateFromMonthKey(value: string): Date | null {
  const match = String(value || '').match(/^(\d{4})-(\d{2})$/)
  if (!match) return null
  return new Date(Number(match[1]), Number(match[2]) - 1, 1)
}

function dateDiffInMonths(from: Date, to: Date): number {
  return (to.getFullYear() - from.getFullYear()) * 12 + to.getMonth() - from.getMonth()
}

function entryTone(entry: PawDatePickerEntry | undefined): PawDatePickerTone | '' {
  if (!entry || !entry.count) return ''
  return entry.tone || (entry.count > 1 ? 'green' : 'orange')
}

export default defineComponent({
  name: 'PawDatePickerSheet',
  components: { PawBottomSheet },
  props: {
    modelValue: { type: Boolean, default: false },
    mode: { type: String as PropType<PawDatePickerMode>, default: 'total' },
    selectedDate: { type: String, default: '' },
    today: { type: String, default: '' },
    initialDate: { type: String, default: '' },
    minDate: { type: String, default: '' },
    maxDate: { type: String, default: '' },
    entries: { type: Array as PropType<PawDatePickerEntry[]>, default: () => [] },
    cacheKey: { type: String, default: '' },
    loadMonth: {
      type: Function as unknown as PropType<PawDatePickerMonthLoader | null>,
      default: null,
    },
    qa: { type: String, default: 'qa-paw-date-picker-sheet' },
    emptyText: { type: String, default: '当天暂无反馈记录' },
  },
  emits: {
    'update:modelValue': eventContract<[value: boolean]>(),
    select: eventContract<[date: string]>(),
    'load-month': eventContract<[month: string]>(),
  },
  data(): PawDatePickerSheetState {
    return {
      viewDate: '',
      loadedMonthKeys: [],
      loadedEntries: [],
      monthEntriesCache: {},
      requestedMonthKeys: [],
      loadingMonthKeys: [],
      calendarScrollIntoView: '',
    }
  },
  computed: {
    valueProxy: {
      get(): boolean {
        return this.modelValue
      },
      set(value: boolean) {
        this.$emit('update:modelValue', value)
      },
    },
    weekdays() {
      return WEEKDAYS
    },
    normalizedSelectedDate(): string {
      return (
        normalizeDate(this.selectedDate) ||
        normalizeDate(this.initialDate) ||
        normalizeDate(this.today) ||
        this.loadedEntries[0]?.date ||
        formatDate(new Date())
      )
    },
    todayDate(): string {
      return normalizeDate(this.today) || formatDate(new Date())
    },
    normalizedMinDate(): string {
      const maxDate = parseDate(this.maxDate) || parseDate(this.todayDate) || new Date()
      const minDate = parseDate(this.minDate) || addMonths(maxDate, -DEFAULT_HISTORY_MONTHS)
      return formatDate(minDate <= maxDate ? minDate : maxDate)
    },
    normalizedMaxDate(): string {
      const maxDate = parseDate(this.maxDate) || parseDate(this.todayDate) || new Date()
      const minDate = parseDate(this.minDate) || addMonths(maxDate, -DEFAULT_HISTORY_MONTHS)
      return formatDate(maxDate >= minDate ? maxDate : minDate)
    },
    availableMonthKeys(): string[] {
      const min = monthStart(this.normalizedMinDate)
      const max = monthStart(this.normalizedMaxDate)
      const span = Math.max(0, Math.min(dateDiffInMonths(min, max), 2400))
      return Array.from({ length: span + 1 }, (_, index) => monthKey(addMonths(min, index)))
    },
    selectedDateLabel(): string {
      const parsed = parseDate(this.normalizedSelectedDate)
      if (!parsed) return this.normalizedSelectedDate || '选择反馈日期'
      return `${parsed.getFullYear()}年${parsed.getMonth() + 1}月${parsed.getDate()}日`
    },
    entriesByDate(): Record<string, PawDatePickerEntry> {
      return this.loadedEntries.reduce<Record<string, PawDatePickerEntry>>((result, entry) => {
        if (!entry || !entry.date) return result
        const previous = result[entry.date]
        if (!previous) {
          result[entry.date] = { ...entry, count: Math.max(1, entry.count || 0) }
          return result
        }
        const count = (previous.count || 0) + Math.max(1, entry.count || 0)
        result[entry.date] = {
          ...previous,
          count,
          total: Math.max(previous.total || 0, entry.total || 0, count),
          label: previous.label || entry.label,
          tone: previous.tone || entry.tone,
        }
        return result
      }, {})
    },
    selectedEntries(): PawDatePickerEntry[] {
      return this.loadedEntries.filter((entry) => entry.date === this.normalizedSelectedDate)
    },
    calendarMonths(): PawDateMonth[] {
      return this.loadedMonthKeys
        .map((key) => dateFromMonthKey(key))
        .filter((date): date is Date => Boolean(date))
        .map((date) => this.createMonth(date))
    },
    fallbackLabel(): string {
      return this.mode === 'pet' ? '该宠物暂无反馈说明' : '小院暂无反馈说明'
    },
  },
  watch: {
    modelValue(value: boolean) {
      if (value) this.resetCalendar()
    },
    entries(value: PawDatePickerEntry[]) {
      this.replaceEntries(value)
    },
    initialDate() {
      if (this.modelValue) this.resetCalendar()
    },
    minDate() {
      if (this.modelValue) this.resetCalendar()
    },
    maxDate() {
      if (this.modelValue) this.resetCalendar()
    },
    cacheKey() {
      this.monthEntriesCache = {}
      this.requestedMonthKeys = []
      this.loadedEntries = this.mergeEntries([], this.entries)
      if (this.modelValue) this.resetCalendar()
    },
  },
  created() {
    this.viewDate = this.initialDate || this.selectedDate || this.todayDate
    this.replaceEntries(this.entries)
  },
  methods: {
    replaceEntries(entries: PawDatePickerEntry[]) {
      const nextEntries = Array.isArray(entries) ? entries : []
      this.loadedEntries = this.loadMonth
        ? this.mergeEntries(this.loadedEntries, nextEntries)
        : this.mergeEntries([], nextEntries)
    },
    mergeEntries(
      current: PawDatePickerEntry[],
      incoming: readonly PawDatePickerEntry[],
    ): PawDatePickerEntry[] {
      const result: PawDatePickerEntry[] = []
      const seen = new Set<string>()
      current.concat(incoming as PawDatePickerEntry[]).forEach((entry) => {
        if (!entry || !entry.date) return
        const key = entry.id
          ? `id:${entry.id}`
          : [
              entry.date,
              entry.count || 0,
              entry.total || 0,
              entry.label || '',
              entry.tone || '',
            ].join('|')
        if (seen.has(key)) return
        seen.add(key)
        result.push({ ...entry, date: normalizeDate(entry.date) || entry.date })
      })
      return result
    },
    resetCalendar() {
      this.viewDate = this.initialDate || this.selectedDate || this.todayDate
      this.loadedEntries = this.mergeEntries([], this.entries)
      if (!this.loadMonth) this.requestedMonthKeys = []
      this.loadingMonthKeys = []
      this.calendarScrollIntoView = ''

      const available = this.availableMonthKeys
      if (!available.length) {
        this.loadedMonthKeys = []
        return
      }
      const selectedMonth = monthKey(this.viewDate) || available[0]
      const centerIndex = Math.max(0, available.indexOf(selectedMonth))
      const start = Math.max(0, centerIndex - 1)
      const end = Math.min(available.length, centerIndex + 2)
      this.loadedMonthKeys = available.slice(start, end)
      this.loadedMonthKeys.forEach((month) => {
        const cached = this.monthEntriesCache[month]
        if (cached) this.loadedEntries = this.mergeEntries(this.loadedEntries, cached)
      })
      this.requestMonths(this.loadedMonthKeys)
    },
    requestMonths(months: readonly string[]) {
      months.forEach((month) => this.requestMonth(month))
    },
    async requestMonth(month: string) {
      if (!month) return
      const cached = this.monthEntriesCache[month]
      if (cached) {
        this.loadedEntries = this.mergeEntries(this.loadedEntries, cached)
        if (!this.requestedMonthKeys.includes(month)) {
          this.requestedMonthKeys = [...this.requestedMonthKeys, month]
        }
        return
      }
      if (this.requestedMonthKeys.includes(month)) return
      this.requestedMonthKeys = [...this.requestedMonthKeys, month]
      this.$emit('load-month', month)
      if (!this.loadMonth) return
      const requestCacheKey = this.cacheKey
      this.loadingMonthKeys = [...this.loadingMonthKeys, month]
      try {
        const result = await this.loadMonth(month)
        if (requestCacheKey !== this.cacheKey) return
        if (Array.isArray(result)) {
          this.monthEntriesCache = { ...this.monthEntriesCache, [month]: result.slice() }
          this.loadedEntries = this.mergeEntries(this.loadedEntries, result)
        }
      } catch {
        this.requestedMonthKeys = this.requestedMonthKeys.filter((value) => value !== month)
      } finally {
        this.loadingMonthKeys = this.loadingMonthKeys.filter((value) => value !== month)
      }
    },
    loadPreviousMonths() {
      const first = this.loadedMonthKeys[0]
      const index = this.availableMonthKeys.indexOf(first)
      if (!first || index <= 0) return
      const previous = this.availableMonthKeys.slice(Math.max(0, index - MONTH_LOAD_BATCH), index)
      const anchor = first
      this.loadedMonthKeys = [...previous, ...this.loadedMonthKeys]
      this.requestMonths(previous)
      this.restoreMonthAnchor(anchor)
    },
    loadNextMonths() {
      const last = this.loadedMonthKeys[this.loadedMonthKeys.length - 1]
      const index = this.availableMonthKeys.indexOf(last)
      if (!last || index < 0 || index >= this.availableMonthKeys.length - 1) return
      const next = this.availableMonthKeys.slice(index + 1, index + 1 + MONTH_LOAD_BATCH)
      this.loadedMonthKeys = [...this.loadedMonthKeys, ...next]
      this.requestMonths(next)
    },
    restoreMonthAnchor(month: string) {
      const anchor = this.monthAnchorId(month)
      this.$nextTick(() => {
        this.calendarScrollIntoView = anchor
        setTimeout(() => {
          if (this.calendarScrollIntoView === anchor) this.calendarScrollIntoView = ''
        }, 80)
      })
    },
    monthAnchorId(month: string): string {
      return `paw-date-picker-month-${month}`
    },
    isDateSelectable(date: string): boolean {
      const normalized = normalizeDate(date)
      return Boolean(
        normalized && normalized >= this.normalizedMinDate && normalized <= this.normalizedMaxDate,
      )
    },
    createMonth(start: Date): PawDateMonth {
      const year = start.getFullYear()
      const month = start.getMonth()
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      const offset = start.getDay()
      const cellCount = Math.ceil((offset + daysInMonth) / 7) * 7
      const cells: PawDateCell[] = []
      for (let index = 0; index < cellCount; index += 1) {
        const date = new Date(year, month, index - offset + 1)
        const key = formatDate(date)
        const entry = this.entriesByDate[key]
        cells.push({
          date: key,
          day: date.getDate(),
          muted: date.getMonth() !== month,
          disabled: !this.isDateSelectable(key),
          count: entry?.count || 0,
          total: entry?.total || entry?.count || 0,
          tone: entryTone(entry),
        })
      }
      return {
        key: `${year}-${pad(month + 1)}`,
        label: `${year}年${month + 1}月`,
        cells,
      }
    },
    selectDate(date: string) {
      if (!this.isDateSelectable(date)) return
      this.requestMonth(monthKey(date))
      this.$emit('select', date)
    },
  },
})
</script>

<style scoped>
.paw-date-picker-sheet {
  display: flex;
  flex: 1 1 auto;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  width: 100%;
  background: #fff;
  color: #333;
}

.paw-date-picker-sheet__calendar {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  flex-direction: column;
}

.paw-date-picker-sheet__weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  flex: 0 0 58px;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
}

.paw-date-picker-sheet__weekday {
  color: #666;
  font-size: 13px;
  line-height: 18px;
  text-align: center;
}

.paw-date-picker-sheet__calendar-scroll {
  flex: 1 1 auto;
  min-height: 0;
}

.paw-date-picker-sheet__months {
  padding: 15px 16px 0;
  box-sizing: border-box;
}

.paw-date-picker-sheet__month + .paw-date-picker-sheet__month {
  margin-top: 13px;
}

.paw-date-picker-sheet__month-title {
  display: block;
  margin-bottom: 7px;
  color: #333;
  font-size: 18px;
  font-weight: 700;
  line-height: 25px;
}

.paw-date-picker-sheet__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  row-gap: 7px;
}

.paw-date-picker-sheet__cell {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
}

.paw-date-picker-sheet__day {
  display: flex;
  width: 30px;
  height: 30px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #333;
  font-size: 13px;
  line-height: 15px;
}

.paw-date-picker-sheet__cell--muted .paw-date-picker-sheet__day {
  color: #ddd;
}

.paw-date-picker-sheet__cell--disabled {
  opacity: 0.45;
}

.paw-date-picker-sheet__cell--today .paw-date-picker-sheet__day {
  background: #ff3d3d;
  color: #fff;
}

.paw-date-picker-sheet__cell--selected .paw-date-picker-sheet__day {
  background: #4fc985;
  color: #fff;
}

.paw-date-picker-sheet__day--marked {
  color: #fff;
}

.paw-date-picker-sheet__day--green {
  background: #4fc985;
}

.paw-date-picker-sheet__day--red {
  background: #e53935;
}

.paw-date-picker-sheet__day--orange {
  background: #ee8002;
}

.paw-date-picker-sheet__day--blue {
  background: #3988d8;
}

.paw-date-picker-sheet__day--gray {
  background: #999;
}

.paw-date-picker-sheet__count {
  font-size: 8px;
  line-height: 9px;
}

.paw-date-picker-sheet__feedback {
  display: flex;
  flex: 0 0 145px;
  height: 145px;
  min-height: 0;
  flex-direction: column;
  box-sizing: border-box;
  margin: 15px 16px 24px;
  padding-top: 15px;
  border-top: 1px solid #f0f0f0;
  overflow: hidden;
}

.paw-date-picker-sheet__feedback-date {
  display: block;
  flex: 0 0 auto;
  color: #333;
  font-size: 16px;
  font-weight: 700;
  line-height: 22px;
}

.paw-date-picker-sheet__feedback-scroll {
  flex: 1 1 auto;
  min-height: 0;
  margin-top: 7px;
}

.paw-date-picker-sheet__feedback-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 16px;
  row-gap: 7px;
}

.paw-date-picker-sheet__feedback-row {
  display: flex;
  align-items: flex-start;
  min-width: 0;
  gap: 7px;
  min-height: 17px;
}

.paw-date-picker-sheet__feedback-dot {
  flex: 0 0 4px;
  width: 4px;
  height: 4px;
  margin-top: 6px;
  border-radius: 50%;
  background: #ee8002;
}

.paw-date-picker-sheet__feedback-dot--green {
  background: #12ca7a;
}

.paw-date-picker-sheet__feedback-dot--red {
  background: #e53935;
}

.paw-date-picker-sheet__feedback-dot--blue {
  background: #3988d8;
}

.paw-date-picker-sheet__feedback-dot--gray {
  background: #999;
}

.paw-date-picker-sheet__feedback-copy,
.paw-date-picker-sheet__feedback-empty {
  color: #666;
  font-size: 11px;
  line-height: 17px;
}

.paw-date-picker-sheet__feedback-copy {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.paw-date-picker-sheet__feedback-empty {
  display: block;
  color: #999;
}
</style>
