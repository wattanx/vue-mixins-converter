import ts, { factory } from 'typescript';

export type ConvertedExpression = {
  expression: string;
  returnNames?: string[];
  use?: string;
};

export const lifecycleNameMap: Map<string, string | undefined> = new Map([
  ['beforeCreate', undefined],
  ['created', undefined],
  ['beforeMount', 'onBeforeMount'],
  ['mounted', 'onMounted'],
  ['beforeUpdate', 'onBeforeUpdate'],
  ['updated', 'onUpdated'],
  ['beforeUnmount', 'onBeforeUnmount'],
  ['beforeDestroy', 'onBeforeUnmount'],
  ['destroyed', 'onUnmounted'],
  ['errorCaptured', 'onErrorCaptured'],
  ['renderTracked', 'onRenderTracked'],
  ['renderTriggered', 'onRenderTriggered'],
]);

export const nonNull = <T>(item: T): item is NonNullable<T> => item != null;

export const getNodeByKind = (
  node: ts.Node,
  kind: ts.SyntaxKind
): ts.Node | undefined => {
  const find = (node: ts.Node): ts.Node | undefined => {
    return ts.forEachChild(node, (child) => {
      if (child.kind === kind) {
        return child;
      }
      return find(child);
    });
  };
  return find(node);
};

export const getInitializerProps = (
  node: ts.Node
): ts.ObjectLiteralElementLike[] => {
  if (!ts.isPropertyAssignment(node)) return [];
  if (!ts.isObjectLiteralExpression(node.initializer)) return [];
  return [...node.initializer.properties];
};

export const storePath = `store`;

export const getMethodExpression = (
  node: ts.Node,
  sourceFile: ts.SourceFile
): ConvertedExpression[] => {
  if (ts.isMethodDeclaration(node)) {
    const async = node.modifiers?.some(
      (mod) => mod.kind === ts.SyntaxKind.AsyncKeyword
    )
      ? 'async'
      : '';

    const name = node.name.getText(sourceFile);
    const type = node.type ? `:${node.type.getText(sourceFile)}` : '';
    const body = node.body?.getText(sourceFile) || '{}';
    const parameters = node.parameters
      .map((param) => param.getText(sourceFile))
      .join(',');
    const fn = `${async}(${parameters})${type} =>${body}`;

    if (lifecycleNameMap.has(name)) {
      const newLifecycleName = lifecycleNameMap.get(name);
      const immediate = newLifecycleName == null ? '()' : '';
      return [
        {
          use: newLifecycleName,
          expression: `${newLifecycleName ?? ''}(${fn})${immediate}`,
        },
      ];
    }
    return [
      {
        returnNames: [name],
        expression: `const ${name} = ${fn}`,
      },
    ];
  } else if (ts.isSpreadAssignment(node)) {
    // mapActions
    if (!ts.isCallExpression(node.expression)) return [];
    const { arguments: args, expression } = node.expression;
    if (!ts.isIdentifier(expression)) return [];
    const mapName = expression.text;
    const [namespace, mapArray] = args;
    if (!ts.isStringLiteral(namespace)) return [];
    if (!ts.isArrayLiteralExpression(mapArray)) return [];

    const namespaceText = namespace.text;
    const names = mapArray.elements as ts.NodeArray<ts.StringLiteral>;

    if (mapName === 'mapActions') {
      return names.map(({ text: name }) => {
        return {
          expression: `const ${name} = () => ${storePath}.dispatch('${namespaceText}/${name}')`,
          returnNames: [name],
        };
      });
    }
  }
  return [];
};

const contextProps = [
  'attrs',
  'slots',
  'parent',
  'root',
  'listeners',
  'refs',
  'emit',
];

export const replaceThisContext = (
  str: string,
  refNameMap: Map<string, true>
) => {
  return str
    .replace(/this\.\$(\w+)/g, (_, p1) => {
      if (contextProps.includes(p1)) return `ctx.${p1}`;
      return `ctx.root.$${p1}`;
    })
    .replace(/this\.([\w-]+)/g, (_, p1) => {
      return refNameMap.has(p1) ? `${p1}.value` : p1;
    });
};

export const getImportStatement = (
  setupProps: ConvertedExpression[],
  useNuxt?: boolean
) => {
  let usedFunctions = [
    'SetupContext',
    ...new Set(setupProps.map(({ use }) => use).filter(nonNull)),
  ];

  const moduleName = useNuxt ? 'nuxtjs' : 'vue';

  if (useNuxt) {
    usedFunctions = [...usedFunctions, 'useStore'];
  }

  const compositionApiImportStatements = ts.createSourceFile(
    '',
    `import { ${usedFunctions.join(
      ','
    )} } from '@${moduleName}/composition-api'`,
    ts.ScriptTarget.Latest
  ).statements;

  const vuexImportStatements = ts.createSourceFile(
    '',
    `import { useStore } from 'vuex';`,
    ts.ScriptTarget.Latest
  ).statements;

  return useNuxt
    ? compositionApiImportStatements
    : [...vuexImportStatements, ...compositionApiImportStatements];
};

export const getExportStatement = (
  setupProps: ConvertedExpression[],
  fileName: string
) => {
  const useStoreStatements = ts.createSourceFile(
    '',
    'const store = useStore()',
    ts.ScriptTarget.Latest
  ).statements;

  const props = [
    factory.createParameterDeclaration(
      undefined,
      undefined,
      undefined,
      factory.createIdentifier('ctx'),
      undefined,
      factory.createTypeReferenceNode(
        factory.createIdentifier('SetupContext'),
        undefined
      ),
      undefined
    ),
  ];

  return factory.createVariableStatement(
    [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    factory.createVariableDeclarationList(
      [
        factory.createVariableDeclaration(
          factory.createIdentifier(fileName),
          undefined,
          undefined,
          factory.createArrowFunction(
            undefined,
            undefined,
            props,
            undefined,
            factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
            factory.createBlock(
              [...useStoreStatements, ...getSetupStatements(setupProps)],
              true
            )
          )
        ),
      ],
      ts.NodeFlags.Const
    )
  );
};

export const getSetupStatements = (setupProps: ConvertedExpression[]) => {
  // this.prop => prop.valueにする対象
  const refNameMap: Map<string, true> = new Map();
  setupProps.forEach(({ use, returnNames }) => {
    if (
      returnNames != null &&
      use != null &&
      /^(toRefs|ref|computed)$/.test(use)
    ) {
      returnNames.forEach((returnName) => {
        refNameMap.set(returnName, true);
      });
    }
  });

  const returnPropsStatement = `return {${setupProps
    .filter((prop) => prop.use !== 'toRefs') // ignore spread props
    .map(({ returnNames }) => returnNames)
    .filter(nonNull)
    .flat()
    .join(',')}}`;

  return [...setupProps, { expression: returnPropsStatement }]
    .map(
      ({ expression }) =>
        ts.createSourceFile(
          '',
          replaceThisContext(expression, refNameMap),
          ts.ScriptTarget.Latest
        ).statements
    )
    .flat();
};
