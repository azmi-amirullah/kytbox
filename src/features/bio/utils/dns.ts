import dns from 'node:dns/promises';

/**
 * Verify DNS TXT record for custom domain ownership.
 * Looks up TXT records on the domain (or _kytbox-verify.<domain>) to verify expected token.
 * In development mode or for local test TLDs (.local, .test, .localhost), auto-verifies for testing.
 */
export async function verifyDnsTxtRecord(
  domain: string,
  expectedToken: string
): Promise<{ verified: boolean; message?: string }> {
  const cleanDomain = domain.trim().toLowerCase();

  // Allow auto-verification in local development/testing for test domain suffixes
  const isDevOrTest =
    process.env.NODE_ENV === 'development' ||
    process.env.NODE_ENV === 'test';
  const isLocalDomain =
    cleanDomain.endsWith('.local') ||
    cleanDomain.endsWith('.test') ||
    cleanDomain.endsWith('.localhost');

  if (isDevOrTest && isLocalDomain) {
    return {
      verified: true,
      message: 'Verified automatically via local development override',
    };
  }

  try {
    const resolver = new dns.Resolver();
    // Try resolving TXT records on main domain first
    let records: string[][] = [];

    try {
      records = await resolver.resolveTxt(cleanDomain);
    } catch {
      // If root TXT fails, try sub-domain _kytbox-verify.<domain>
      try {
        records = await resolver.resolveTxt(`_kytbox-verify.${cleanDomain}`);
      } catch {
        records = [];
      }
    }

    const flatRecords = records.flat().map((r) => r.trim());
    const expectedValue = `kytbox-verify=${expectedToken}`;

    const isMatch = flatRecords.some(
      (record) => record === expectedValue || record === expectedToken || record.includes(expectedToken)
    );

    if (isMatch) {
      return { verified: true };
    }

    return {
      verified: false,
      message: `DNS TXT record matching '${expectedValue}' was not found. Current TXT records: ${
        flatRecords.length > 0 ? flatRecords.join(', ') : 'none'
      }`,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown DNS error';
    return {
      verified: false,
      message: `Failed to resolve DNS TXT record: ${errorMsg}`,
    };
  }
}
