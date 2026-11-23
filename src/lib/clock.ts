/**
 * Geçen süreyi ölçmek için zaman damgası.
 * Yalnızca olay işleyicileri ve efektler içinden çağrılır; render sırasında kullanılmaz.
 * (React derleyicisinin `purity` kuralı, özel bileşenlere verilen işleyicileri
 * ayırt edemediği için Date.now doğrudan bileşen içinde yazılmıyor.)
 */
export function nowMs() {
  return Date.now();
}
