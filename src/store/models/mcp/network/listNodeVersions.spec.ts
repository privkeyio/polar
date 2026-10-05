import { createStore } from 'easy-peasy';
import { createMockRootModel, injections } from 'utils/tests';

describe('MCP model > listNodeVersions', () => {
  const rootModel = createMockRootModel();

  // initialize store for type inference
  let store = createStore(rootModel, { injections });

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(rootModel, { injections });
    jest.clearAllMocks();
  });

  it('should return all supported node versions', async () => {
    const result = await store.getActions().mcp.listNodeVersions({});

    expect(result.versions).toBeDefined();
    expect(result.versions.bitcoind).toContain('29.4.2');
    expect(result.versions.LND).toContain('0.21.3-beta-blake2b.17');
    expect(result.versions['c-lightning']).toContain('26.06.8-blake2b.6');
    expect(result.latest).toBeDefined();
    expect(result.compatibility).toBeDefined();
    expect(result.compatibility.LND).toBeDefined();
    expect(result.compatibility.LND?.['0.21.3-beta-blake2b.17']).toBe('29.4.2');
    expect(result.message).toContain('All supported node versions');
  });

  it('should return versions for specific implementation', async () => {
    const result = await store.getActions().mcp.listNodeVersions({
      implementation: 'bitcoind',
    });

    expect(result.versions).toBeDefined();
    expect(result.versions.bitcoind).toBeDefined();
    expect(result.versions.bitcoind).toContain('29.4.2');
    expect(result.latest.bitcoind).toBe('29.4.2');
    expect(result.compatibility.bitcoind).toBeUndefined(); // bitcoind has no compatibility requirements
    // Should not contain other implementations when filtered
    expect(result.versions.LND).toBeUndefined();
    expect(result.message).toContain('Available versions for bitcoind');
  });
});
