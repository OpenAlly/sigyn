// Import Node.js Dependencies
import assert from "node:assert";
import { after, before, describe, it } from "node:test";

// Import Third-party Dependencies
import { MockAgent, getGlobalDispatcher, setGlobalDispatcher } from "@myunisoft/httpie";

// Import Internal Dependencies
import * as utils from "../src/utils";
import { SigynConfig, SigynRule } from "../src/types";

// CONSTANTS
const kDummyUrl = "http://localhost:3000";
const kMockAgent = new MockAgent();
const kGlobalDispatcher = getGlobalDispatcher();

describe("utils.initializeRules()", () => {
  before(() => {
    process.env.GRAFANA_API_TOKEN = "toto";
    setGlobalDispatcher(kMockAgent);

    const pool = kMockAgent.get(kDummyUrl);
    pool.intercept({
      path: (path) => path.includes("env")
    }).reply(200, { data: ["prod", "dev"] }, { headers: { "Content-Type": "application/json" } }).persist();
  });

  after(() => {
    setGlobalDispatcher(kGlobalDispatcher);
  });

  it("should create rule for each label filter", async() => {
    const rules: Partial<SigynRule>[] = [
      {
        name: "foo",
        logql: "{app=\"foo\"} |= `my super logql`",
        alert: {
          on: {
            count: 5,
            interval: "1h"
          },
          severity: "information",
          template: {
            title: "title"
          }
        }
      },
      {
        name: "bar",
        logql: "{env={label.env}} |= `my super logql`",
        labelFilters: {
          env: ["prod", "dev"]
        },
        alert: {
          on: {
            count: 5,
            interval: "1h"
          },
          severity: "information",
          template: {
            title: "title"
          }
        }
      },
      {
        name: "baz",
        logql: "{app=\"foo\", env={label.env}} |= `my super logql`",
        labelFilters: {
          env: ["prod", "dev"]
        },
        alert: {
          on: {
            count: 5,
            interval: "1h"
          },
          severity: "information",
          template: {
            title: "title"
          }
        }
      }
    ];
    const expectedRules: Partial<SigynRule>[] = [
      {
        name: "foo",
        logql: "{app=\"foo\"} |= `my super logql`",
        alert: {
          on: {
            count: 5,
            interval: "1h"
          },
          severity: "information",
          template: {
            title: "title"
          }
        }
      },
      {
        name: "bar (env = prod)",
        logql: "{env=\"prod\"} |= `my super logql`",
        labelFilters: {
          env: ["prod", "dev"]
        },
        alert: {
          on: {
            count: 5,
            interval: "1h"
          },
          severity: "information",
          template: {
            title: "title"
          }
        }
      },
      {
        name: "bar (env = dev)",
        logql: "{env=\"dev\"} |= `my super logql`",
        labelFilters: {
          env: ["prod", "dev"]
        },
        alert: {
          on: {
            count: 5,
            interval: "1h"
          },
          severity: "information",
          template: {
            title: "title"
          }
        }
      },
      {
        name: "baz (env = prod)",
        logql: "{app=\"foo\", env=\"prod\"} |= `my super logql`",
        labelFilters: {
          env: ["prod", "dev"]
        },
        alert: {
          on: {
            count: 5,
            interval: "1h"
          },
          severity: "information",
          template: {
            title: "title"
          }
        }
      },
      {
        name: "baz (env = dev)",
        logql: "{app=\"foo\", env=\"dev\"} |= `my super logql`",
        labelFilters: {
          env: ["prod", "dev"]
        },
        alert: {
          on: {
            count: 5,
            interval: "1h"
          },
          severity: "information",
          template: {
            title: "title"
          }
        }
      }
    ];
    const config = {
      loki: {
        apiUrl: kDummyUrl
      },
      rules
    };
    assert.deepEqual(await utils.initializeRules(config as SigynConfig), expectedRules);
  });

  it("should extends template content (array)", async() => {
    const rules: Partial<SigynRule>[] = [
      {
        name: "foo",
        logql: "{app=\"foo\"} |= `my super logql`",
        alert: {
          on: {
            count: 5,
            interval: "1h"
          },
          severity: "information",
          template: {
            extends: "foo",
            content: ["bar"]
          }
        }
      }
    ];
    const expectedRules: Partial<SigynRule>[] = [
      {
        name: "foo",
        logql: "{app=\"foo\"} |= `my super logql`",
        alert: {
          on: {
            count: 5,
            interval: "1h"
          },
          severity: "information",
          template: {
            content: [
              "foo",
              "bar"
            ],
            title: undefined
          }
        }
      }
    ];
    const config = {
      templates: {
        foo: {
          content: [
            "foo"
          ]
        }
      },
      loki: {
        apiUrl: kDummyUrl
      },
      rules
    };
    assert.deepEqual(await utils.initializeRules(config as unknown as SigynConfig), expectedRules);
  });
  it("should extends template content (array)", async() => {
    const rules: Partial<SigynRule>[] = [
      {
        name: "foo",
        logql: "{app=\"foo\"} |= `my super logql`",
        alert: {
          on: {
            count: 5,
            interval: "1h"
          },
          severity: "information",
          template: {
            extends: "foo",
            content: ["bar"]
          }
        }
      }
    ];
    const expectedRules: Partial<SigynRule>[] = [
      {
        name: "foo",
        logql: "{app=\"foo\"} |= `my super logql`",
        alert: {
          on: {
            count: 5,
            interval: "1h"
          },
          severity: "information",
          template: {
            content: [
              "foo",
              "bar"
            ],
            title: undefined
          }
        }
      }
    ];
    const config = {
      templates: {
        foo: {
          content: [
            "foo"
          ]
        }
      },
      loki: {
        apiUrl: kDummyUrl
      },
      rules
    };
    assert.deepEqual(await utils.initializeRules(config as unknown as SigynConfig), expectedRules);
  });

  it("should extends template content (after)", async() => {
    const rules: Partial<SigynRule>[] = [
      {
        name: "foo",
        logql: "{app=\"foo\"} |= `my super logql`",
        alert: {
          on: {
            count: 5,
            interval: "1h"
          },
          severity: "information",
          template: {
            extends: "foo",
            content: {
              after: ["bar"]
            }
          }
        }
      }
    ];
    const expectedRules: Partial<SigynRule>[] = [
      {
        name: "foo",
        logql: "{app=\"foo\"} |= `my super logql`",
        alert: {
          on: {
            count: 5,
            interval: "1h"
          },
          severity: "information",
          template: {
            content: [
              "foo",
              "bar"
            ],
            title: undefined
          }
        }
      }
    ];
    const config = {
      templates: {
        foo: {
          content: [
            "foo"
          ]
        }
      },
      loki: {
        apiUrl: kDummyUrl
      },
      rules
    };
    assert.deepEqual(await utils.initializeRules(config as unknown as SigynConfig), expectedRules);
  });

  it("should extends template content (before)", async() => {
    const rules: Partial<SigynRule>[] = [
      {
        name: "foo",
        logql: "{app=\"foo\"} |= `my super logql`",
        alert: {
          on: {
            count: 5,
            interval: "1h"
          },
          severity: "information",
          template: {
            extends: "foo",
            content: {
              before: ["bar"]
            }
          }
        }
      }
    ];
    const expectedRules: Partial<SigynRule>[] = [
      {
        name: "foo",
        logql: "{app=\"foo\"} |= `my super logql`",
        alert: {
          on: {
            count: 5,
            interval: "1h"
          },
          severity: "information",
          template: {
            content: [
              "bar",
              "foo"
            ],
            title: undefined
          }
        }
      }
    ];
    const config = {
      templates: {
        foo: {
          content: [
            "foo"
          ]
        }
      },
      loki: {
        apiUrl: kDummyUrl
      },
      rules
    };
    assert.deepEqual(await utils.initializeRules(config as unknown as SigynConfig), expectedRules);
  });

  it("should extends template content (before and after)", async() => {
    const rules: Partial<SigynRule>[] = [
      {
        name: "foo",
        logql: "{app=\"foo\"} |= `my super logql`",
        alert: {
          on: {
            count: 5,
            interval: "1h"
          },
          severity: "information",
          template: {
            extends: "foo",
            content: {
              before: ["bar"],
              after: ["baz"]
            }
          }
        }
      }
    ];
    const expectedRules: Partial<SigynRule>[] = [
      {
        name: "foo",
        logql: "{app=\"foo\"} |= `my super logql`",
        alert: {
          on: {
            count: 5,
            interval: "1h"
          },
          severity: "information",
          template: {
            content: [
              "bar",
              "foo",
              "baz"
            ],
            title: undefined
          }
        }
      }
    ];
    const config = {
      templates: {
        foo: {
          content: [
            "foo"
          ]
        }
      },
      loki: {
        apiUrl: kDummyUrl
      },
      rules
    };
    assert.deepEqual(await utils.initializeRules(config as unknown as SigynConfig), expectedRules);
  });

  it("should replace extended template title", async() => {
    const rules: Partial<SigynRule>[] = [
      {
        name: "foo",
        logql: "{app=\"foo\"} |= `my super logql`",
        alert: {
          on: {
            count: 5,
            interval: "1h"
          },
          severity: "information",
          template: {
            extends: "foo",
            title: "bar"
          }
        }
      }
    ];
    const expectedRules: Partial<SigynRule>[] = [
      {
        name: "foo",
        logql: "{app=\"foo\"} |= `my super logql`",
        alert: {
          on: {
            count: 5,
            interval: "1h"
          },
          severity: "information",
          template: {
            content: [],
            title: "bar"
          }
        }
      }
    ];
    const config = {
      templates: {
        foo: {
          title: "foo"
        }
      },
      loki: {
        apiUrl: kDummyUrl
      },
      rules
    };
    assert.deepEqual(await utils.initializeRules(config as unknown as SigynConfig), expectedRules);
  });
});
