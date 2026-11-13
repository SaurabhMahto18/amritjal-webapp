import { Link } from "react-router-dom";

export default function Button({
  children,
  to,
  href,
  variant = "primary",
  className = "",
  ...props
}) {
  const styles = {
    primary: "bg-[#087E85] text-white hover:bg-[#066B71]",
    secondary:
      "border border-slate-300 bg-white text-[#08172B] hover:border-[#087E85] hover:text-[#087E85]",
  };

  const classes = `inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-bold transition ${
    styles[variant] || styles.primary
  } ${className}`;

  if (to) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  );
}