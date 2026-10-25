export default function ShopLoading() {
  return (
    <main className="shop-page" id="main-content" aria-busy="true">
      <div className="container shop-page__container">
        <section aria-live="polite" className="status-state" role="status">
          <h1 className="status-state__title">Loading the catalogue</h1>
          <p className="status-state__description">Product listings will appear shortly.</p>
        </section>
      </div>
    </main>
  );
}
