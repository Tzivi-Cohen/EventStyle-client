export const tabListClass = 'mb-7 flex flex-wrap gap-2'

const tabBase =
  'min-h-[40px] cursor-pointer rounded-[999px] border px-4 py-[0.4rem] [font:inherit] transition-[background,color] duration-200 ease-studio'

export const tabClass = (active: boolean) =>
  active ? `${tabBase} active border-navy bg-navy text-white` : `${tabBase} border-line-strong bg-surface text-ink hover:border-gold`
