try {
    const r = await fetch('https://registry.npmjs.org/pnpm/-/pnpm-11.9.0.tgz', {signal: AbortSignal.timeout(30000)});
    console.log('OK', r.status);
} catch(e) {
    console.log('ERR', e.name, e.message);
    if (e.cause) console.log('CAUSE', e.cause.message);
}
