const field = 'flex min-w-[160px] flex-col gap-1 text-[0.875rem] text-ink-soft'

export const filterClasses = {
  bar: 'card card-padded flex flex-wrap items-end gap-4 px-5 py-4',
  field: `${field} flex-[1_1_160px]`,
  wide: `${field} flex-[2_1_220px]`,
  inline: `${field} flex-[0_0_auto]`,
  range: `${field} m-0 flex-[1_1_200px] border-0 p-0`,
  legend: 'mb-1 p-0',
  rangeInputs: 'flex items-center gap-[0.4rem]',
  rangeInput: 'min-w-0 flex-1',
  error: 'field-error text-[0.8rem]',
}
