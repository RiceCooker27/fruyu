export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

export function formatDateOnly(dateStr: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr))
}

export function todayWIB(): { start: string; end: string } {
  const now = new Date()
  const wib = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
  return {
    start: `${wib}T00:00:00+07:00`,
    end: `${wib}T23:59:59+07:00`,
  }
}

export function thisWeekWIB(): { start: string; end: string } {
  const now = new Date()
  const jakartaOffset = 7 * 60
  const localOffset = now.getTimezoneOffset()
  const jakartaNow = new Date(now.getTime() + (jakartaOffset + localOffset) * 60000)
  const day = jakartaNow.getDay()
  const diffToMonday = (day === 0 ? -6 : 1 - day)
  const monday = new Date(jakartaNow)
  monday.setDate(jakartaNow.getDate() + diffToMonday)
  const mondayStr = monday.toISOString().slice(0, 10)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const sundayStr = sunday.toISOString().slice(0, 10)
  return {
    start: `${mondayStr}T00:00:00+07:00`,
    end: `${sundayStr}T23:59:59+07:00`,
  }
}

export function thisMonthWIB(): { start: string; end: string } {
  const now = new Date()
  const jakartaOffset = 7 * 60
  const localOffset = now.getTimezoneOffset()
  const jakartaNow = new Date(now.getTime() + (jakartaOffset + localOffset) * 60000)
  const year = jakartaNow.getFullYear()
  const month = String(jakartaNow.getMonth() + 1).padStart(2, '0')
  const lastDay = new Date(jakartaNow.getFullYear(), jakartaNow.getMonth() + 1, 0).getDate()
  return {
    start: `${year}-${month}-01T00:00:00+07:00`,
    end: `${year}-${month}-${String(lastDay).padStart(2, '0')}T23:59:59+07:00`,
  }
}
