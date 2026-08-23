// 天地图 JS API 4.0 动态加载器（无官方 npm 包，自封装 Promise 单例）。
// 全局命名空间为 window.T。Key 用浏览器端 Key，靠域名白名单保护。

declare global {
  interface Window {
    T?: any;
    __tdtPromise?: Promise<any>;
  }
}

let loadPromise: Promise<any> | null = null;

export function loadTDT(tk: string): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR 无 window"));
  if (window.T) return Promise.resolve(window.T);
  if (loadPromise) return loadPromise;
  if (!tk) return Promise.reject(new Error("未配置天地图浏览器端 Key (VITE_TIANDITU_TK)"));

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://api.tianditu.gov.cn/api?v=4.0&tk=${encodeURIComponent(tk)}`;
    script.async = true;
    script.onload = () => {
      if (window.T) resolve(window.T);
      else reject(new Error("天地图已加载但未挂载全局 T"));
    };
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("天地图 JS API 加载失败（检查网络/Key/白名单）"));
    };
    document.head.appendChild(script);
  });
  return loadPromise;
}
