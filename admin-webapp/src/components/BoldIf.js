
export function BoldIf({ children, condition }) {
  return (
    <span
      style={{
        fontWeight: condition ? 'bold' : 'normal',
      }}
    >
      {children}
    </span>
  );
}
