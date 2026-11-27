'use client'

import type { SettingsFormModel } from '../use-settings-form'

export function SettingsDesktopView({ model }: { model: SettingsFormModel }) {
  const { settings, setSettings, settingsError, settingsNotice, isSavingSettings, password, setPassword, confirmPassword, setConfirmPassword, passwordError, passwordNotice, isSavingPassword, submitSettings, submitPassword } = model

  return (
    <section className="space-y-6 max-sm:space-y-3">
      <header>
        <h1 className="text-3xl max-sm:text-lg font-bold text-gray-950">Cài đặt</h1>
        <p className="mt-1 text-sm leading-snug text-gray-900">Điều chỉnh thông tin và cách cửa hàng hoạt động.</p>
      </header>

      <form onSubmit={submitSettings} className="space-y-5 max-sm:space-y-3 rounded-xl border border-gray-300 bg-white p-5 max-sm:p-3">
        <h2 className="text-2xl max-sm:text-lg font-bold text-gray-950">Thông tin cửa hàng</h2>
        <label className="block font-semibold text-gray-900">
          Tên cửa hàng
          <input
            required
            maxLength={150}
            value={settings.store_name}
            onChange={(event) => setSettings({ ...settings, store_name: event.target.value })}
            className="mt-1 min-h-12 w-full rounded-lg border border-gray-400 px-3 py-2 font-normal"
          />
        </label>

        <fieldset className="space-y-2">
          <legend className="font-semibold text-gray-900">Bước làm tròn giá bán</legend>
          <div className="flex flex-wrap gap-3 max-sm:gap-2">
            {([
              [100, '100đ'],
              [500, '500đ'],
              [1000, '1.000đ'],
            ] as const).map(([value, label]) => (
              <label key={value} className="flex min-h-12 items-center gap-2 rounded-lg border border-gray-300 px-4 max-sm:px-3 py-2">
                <input
                  type="radio"
                  name="rounding-step"
                  checked={settings.rounding_step === value}
                  onChange={() => setSettings({ ...settings, rounding_step: value })}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="font-semibold text-gray-900">Cỡ chữ giao diện</legend>
          <div className="grid gap-3 max-sm:gap-2 sm:grid-cols-3">
            {([
              ['medium', 'Vừa'],
              ['large', 'Lớn'],
              ['xlarge', 'Rất lớn'],
            ] as const).map(([value, label]) => (
              <label key={value} className="flex min-h-12 items-center gap-2 rounded-lg border border-gray-300 px-4 max-sm:px-3 py-2">
                <input
                  type="radio"
                  name="font-size"
                  checked={settings.font_size === value}
                  onChange={() => setSettings({ ...settings, font_size: value })}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block font-semibold text-gray-900">
          Ngưỡng cảnh báo sắp hết hàng
          <input
            type="number"
            inputMode="decimal"
            min="0"
            max="999999999.999"
            step="0.001"
            value={settings.min_stock_threshold}
            onChange={(event) => setSettings({
              ...settings,
              min_stock_threshold: Number(event.target.value),
            })}
            className="mt-1 min-h-12 w-full rounded-lg border border-gray-400 px-3 py-2 font-normal sm:max-w-xs"
          />
          <span className="mt-1 block text-sm font-normal leading-snug text-gray-900">Số lượng mặc định là 5.</span>
        </label>

        <label className="flex min-h-12 items-center gap-3 max-sm:gap-2 rounded-lg border border-gray-300 p-3">
          <input
            type="checkbox"
            checked={settings.allow_sell_out_of_stock}
            onChange={(event) => setSettings({
              ...settings,
              allow_sell_out_of_stock: event.target.checked,
            })}
            className="h-6 w-6"
          />
          Cho phép bán khi số lượng trong kho đã hết
        </label>

        {settingsError && <p role="alert" className="text-red-800">{settingsError}</p>}
        {settingsNotice && <p role="status" className="text-green-900">{settingsNotice}</p>}
        <button
          type="submit"
          disabled={isSavingSettings}
          className="rounded-lg bg-blue-800 px-5 max-sm:px-3 py-3 max-sm:py-2 font-semibold text-white disabled:opacity-100 disabled:bg-gray-200 disabled:text-gray-900 disabled:border-gray-400"
        >
          {isSavingSettings ? 'Đang lưu…' : 'Lưu cài đặt'}
        </button>
      </form>

      <form onSubmit={submitPassword} className="space-y-4 max-sm:space-y-3 rounded-xl border border-gray-300 bg-white p-5 max-sm:p-3">
        <h2 className="text-2xl max-sm:text-lg font-bold text-gray-950">Đổi mật khẩu</h2>
        <label className="block font-semibold text-gray-900">
          Mật khẩu mới
          <input
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 min-h-12 w-full rounded-lg border border-gray-400 px-3 py-2 font-normal"
          />
        </label>
        <label className="block font-semibold text-gray-900">
          Nhập lại mật khẩu mới
          <input
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="mt-1 min-h-12 w-full rounded-lg border border-gray-400 px-3 py-2 font-normal"
          />
        </label>
        {passwordError && <p role="alert" className="text-red-800">{passwordError}</p>}
        {passwordNotice && <p role="status" className="text-green-900">{passwordNotice}</p>}
        <button
          type="submit"
          disabled={isSavingPassword}
          className="rounded-lg bg-blue-800 px-5 max-sm:px-3 py-3 max-sm:py-2 font-semibold text-white disabled:opacity-100 disabled:bg-gray-200 disabled:text-gray-900 disabled:border-gray-400"
        >
          {isSavingPassword ? 'Đang đổi…' : 'Đổi mật khẩu'}
        </button>
      </form>

      <section className="space-y-3 rounded-xl border border-gray-300 bg-white p-5 max-sm:p-3">
        <h2 className="text-2xl max-sm:text-lg font-bold text-gray-950">Sao lưu dữ liệu</h2>
        <p className="text-sm leading-snug text-gray-900">
          Tải tệp sao lưu để lưu giữ thông tin cửa hàng. Có thể mở tệp bằng Excel.
        </p>
        <a
          href="/api/cai-dat/sao-luu"
          className="inline-flex items-center justify-center rounded-lg bg-green-800 px-5 max-sm:px-3 py-3 max-sm:py-2 font-semibold text-white hover:bg-green-800"
        >
          Tải toàn bộ dữ liệu
        </a>
      </section>
    </section>
  )
}
