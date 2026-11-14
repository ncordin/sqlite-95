
export const Space = ({ size = null, vertical = false }) => {
  if (vertical) {
    return <div style={{ height: `${size || 1}rem` }}></div>;
  }
  return <span style={{ width: `${size || 0.5}rem` }}></span>;
};
