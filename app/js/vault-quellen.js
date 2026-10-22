/* Lesender Anschluss an bereits registrierte, gespeicherte Vault-Quellen.
   Der originale Mooncells-Verweis bleibt erhalten; keine Importe oder Writes. */
const antworten = new Map();
const hash = x => typeof x === 'string' && /^[0-9a-f]{64}$/.test(x);

export async function bindeVaultquellen(daten, lesen){
  const varianten = Array.isArray(daten?.variants) ? daten.variants : [];
  const variants = await Promise.all(varianten.map(async v => {
    const ref = v.source_ref;
    if(ref?.system !== 'vault' || typeof ref.locator !== 'string'
      || !ref.locator.startsWith('/') || !hash(ref.content_sha256)) return v;
    const key = ref.locator + '\n' + ref.content_sha256;
    if(!antworten.has(key)){
      const q = new URLSearchParams({path:ref.locator, content_sha256:ref.content_sha256});
      antworten.set(key, Promise.resolve().then(() => lesen('/lichtwerk/vault-source?' + q)).catch(() => null));
    }
    const r = await antworten.get(key);
    if(!r || r.source_ref?.content_sha256 !== ref.content_sha256
      || r.source?.source_revision_id !== ref.content_sha256){
      // Ein vorübergehend ruhender Reader ist keine dauerhafte Quellenlücke.
      // Erst die nächste ausdrücklich angeforderte Graph-Lesung versucht erneut.
      antworten.delete(key);
      return v;
    }
    return {...v, reader_source:{...r, vault_path:ref.locator}};
  }));
  return {...daten, variants};
}
