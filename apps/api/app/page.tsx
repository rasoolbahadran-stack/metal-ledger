export default function ApiHome() {
  return (
    <main style={{ maxWidth: 720, margin: "10vh auto", padding: 24, lineHeight: 2 }}>
      <h1>هسته API فلزنگار</h1>
      <p>این سرویس برای پردازش امن حساب‌ها و معاملات طراحی شده است.</p>
      <p>برای بررسی سلامت سرویس به <code>/api/health</code> مراجعه کنید.</p>
    </main>
  );
}
