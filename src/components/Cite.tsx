interface Props {
  ids: string[]
  onOpen: (id: string) => void
}

/** Clickable Health Event citations. Every claim in Sijil carries one. */
export default function Cite({ ids, onOpen }: Props) {
  return (
    <>
      {ids.map((id) => (
        <button type="button" key={id} className="cite" onClick={() => onOpen(id)} title={`Open source ${id}`}>
          {id}
        </button>
      ))}
    </>
  )
}
