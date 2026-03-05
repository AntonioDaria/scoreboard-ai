import type { FormResult } from "@/data/mockData";

const FormBadge = ({ result }: { result: FormResult }) => {
  const styles = {
    W: "bg-win/20 text-win border-win/30",
    D: "bg-draw/20 text-draw border-draw/30",
    L: "bg-loss/20 text-loss border-loss/30",
  };

  return (
    <span
      className={`inline-flex h-7 w-7 items-center justify-center rounded-md border text-xs font-bold ${styles[result]}`}
    >
      {result}
    </span>
  );
};

export default FormBadge;
