import Parser from 'web-tree-sitter';
import path from 'path';

export class ASTValidator {
  private parser: Parser | null = null;

  // 1. 初始化解析器并加载 WASM 语言包
  async init() {
    await Parser.init();
    this.parser = new Parser();
    
    // 定位到刚才下载的 wasm 文件
    const wasmPath = path.resolve(__dirname, '../assets/tree-sitter-typescript.wasm');
    const lang = await Parser.Language.load(wasmPath);
    this.parser.setLanguage(lang);
  }

  // 2. 根据大模型给出的函数名，精准锁定真实的起止行号
  findRealCoordinates(sourceCode: string, targetFunctionName: string) {
    if (!this.parser) throw new Error("解析器未初始化");
    
    const tree = this.parser.parse(sourceCode);
    let realStartLine = -1;
    let realEndLine = -1;

    const walkTree = (cursor: Parser.TreeCursor) => {
      // 寻找函数或方法定义
      if (cursor.nodeType === 'function_declaration' || cursor.nodeType === 'method_definition') {
        const nameNode = cursor.currentNode.children.find(child => child.type === 'identifier');
        
        if (nameNode && nameNode.text === targetFunctionName) {
          // Tree-sitter 行号从 0 开始，加 1 对应真实行号
          realStartLine = cursor.currentNode.startPosition.row + 1;
          realEndLine = cursor.currentNode.endPosition.row + 1;
          return true; 
        }
      }

      if (cursor.gotoFirstChild()) {
        do {
          if (walkTree(cursor)) return true;
        } while (cursor.gotoNextSibling());
        cursor.gotoParent();
      }
      return false;
    };

    walkTree(tree.walk());

    if (realStartLine === -1) {
      throw new Error(`确定性验证失败：未在源文件中找到名为 ${targetFunctionName} 的函数。`);
    }

    return { realStartLine, realEndLine };
  }
}
