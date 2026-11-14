export default function Widget({ id, title }) {
  return (
    <section className={`widget widget--${id}`} aria-labelledby={`${id}-title`}>
      <header className="widget-header">
        <h2 id={`${id}-title`}>{title}</h2>
      </header>
    </section>
  )
}
