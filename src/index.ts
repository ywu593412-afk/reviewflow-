export function testBug() {
  const data = [1, 2, 3];
  // 故意制造：魔术数字 (Style) + 越界隐式解引用 (Logic) + 未处理的异步 (Logic)
  if (data.length > 0) {
    console.log(data[5].id); 
  }
  Promise.resolve('test');
}
