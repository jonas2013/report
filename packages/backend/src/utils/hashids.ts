import Hashids from 'hashids';

const projectHasher = new Hashids('project', 12);
const reportHasher = new Hashids('report', 12);

export function encodeProjectId(id: string): string {
  const num = BigInt('0x' + id.replace(/[^a-z0-9]/gi, '').slice(0, 16));
  return projectHasher.encode(Number(num));
}

export function encodeReportId(id: string): string {
  const num = BigInt('0x' + id.replace(/[^a-z0-9]/gi, '').slice(0, 16));
  return reportHasher.encode(Number(num));
}
