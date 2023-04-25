interface schema {
  [key: string]: any;
}

export const style: schema = {
  flex: { display: "flex" },
  block: { display: "block" },
  none: { display: "none" },
  grid: { display: "grid" },
  screen: { width: "100vw", height: "100vh" },
  bg: { backgroundColor: "unset" },
  transition: { transition: "unset" },
  translate: { translate: "unset" },
  opacity: { opacity: "unset" },
};
