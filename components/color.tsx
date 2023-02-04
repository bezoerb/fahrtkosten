type ColorProps = {
  color: string;
  dashed?: boolean;
  className?: string;
};

export const Color = (props: ColorProps) => {
  if (props.dashed) {
    return (
      <>
        <span style={{ backgroundColor: props.color }} className={`h-0.5 w-2 mr-0.5 inline-block ${props.className}`} />
        <span style={{ backgroundColor: props.color }} className={`h-0.5 w-2 mr-0.5 inline-block ${props.className}`} />
        <span style={{ backgroundColor: props.color }} className={`h-0.5 w-2 inline-block ${props.className}`} />
      </>
    );
  }

  return <span style={{ backgroundColor: props.color }} className={`h-0.5 w-7 inline-block ${props.className}`} />;
};
