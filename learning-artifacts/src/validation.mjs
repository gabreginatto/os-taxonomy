import fs from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import { packageRoot, hash } from './taxonomy.mjs';

const schemaPath = path.join(packageRoot, 'schemas/manifest.schema.json');
export const validationPolicy = '1.0.0';
const validate = new Ajv2020({allErrors:true,strict:false}).compile(JSON.parse(fs.readFileSync(schemaPath)));
export function validateManifest(manifest) {
  if (!validate(manifest)) throw new Error('Invalid manifest: ' + JSON.stringify(validate.errors));
  return manifest;
}
export function fingerprintFiles(root, filenames) {
  return Object.fromEntries([...filenames].sort().map(name => {
    if(path.isAbsolute(name) || name.split(/[\\/]/).includes('..')) throw new Error('Unsafe artifact path');
    return [name, hash(fs.readFileSync(path.join(root,name)))];
  }));
}
export function verifySourceHashes(root, manifest) {
  const actual = fingerprintFiles(root,Object.keys(manifest.source_files));
  const changed = Object.keys(actual).filter(key => actual[key] !== manifest.source_files[key]);
  if(changed.length) throw new Error('Artifact changed since generation: ' + changed.join(', ') + '. Rebuild and reverify.');
  if(hash(JSON.stringify(actual)) !== manifest.fingerprints.accepted_source) throw new Error('Accepted-source fingerprint mismatch');
  return true;
}
export function validationFingerprint(manifest, browserProfile) {
  const files=['src/validation.mjs','src/verify.mjs','src/model-checks.mjs','src/extensions.mjs','src/video.mjs','scripts/verify_browser.py','scripts/verify_video.py'];
  const implementation=files.map(name=>[name,hash(fs.readFileSync(path.join(packageRoot,name)))]);
  return hash(JSON.stringify({source:manifest.fingerprints.accepted_source,policy:validationPolicy,schema:hash(fs.readFileSync(schemaPath)),implementation,browserProfile}));
}
export function videoValidationFingerprint() {
  return hash(JSON.stringify({policy:validationPolicy,files:['src/video.mjs','scripts/verify_video.py','package-lock.json'].map(name=>[name,hash(fs.readFileSync(path.join(packageRoot,name)))])}));
}
