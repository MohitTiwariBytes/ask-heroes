import React from "react";
import "./Button.css";
import OsmoButton from "@premium/osmo-button";

// Renders the Osmo button when its licensed file is present locally,
// otherwise a plain fallback with the same props.
// Usage: <Button href="/ask">Ask</Button> or <Button onClick={fn}>Ask</Button>
export default function Button(props) {
  if (OsmoButton) return <OsmoButton {...props} />;
  return <FallbackButton {...props} />;
}

export function FallbackButton({ href, children, className = "", ...rest }) {
  const classes = `fallback-button glass glass-ink ${className}`.trim();

  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  );
}
