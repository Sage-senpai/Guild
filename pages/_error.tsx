// Custom Pages Router _error — intentionally avoids next/head and all hooks.
// See pages/404.tsx for context.
function Error({ statusCode }: { statusCode?: number }) {
  return null;
}

Error.getInitialProps = ({ res, err }: { res?: { statusCode: number }; err?: { statusCode: number } }) => {
  const statusCode = res?.statusCode ?? err?.statusCode ?? 404;
  return { statusCode };
};

export default Error;
