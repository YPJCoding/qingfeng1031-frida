# Frida JS 兼容性整理总结 - 全量 Active 测试版

## 一眼结论

这篇是基于最新 **Frida full active compatibility probe** 的整理版本，用来替代之前基于旧探针的笔记。

本次测试环境：

```
Frida.version: 16.3.1
Script.runtime: QJS
Process.arch: ia32
Process.platform: linux
Process.pointerSize: 4
Process.mainModule: df_game_r
Process.id: 1469
```

全量测试结果：

```
Total: 551
OK:    509
FAIL:  42
SKIP:  0
```

分段结果：

| 探针段 | Total | OK | FAIL | SKIP |
| --- | --- | --- | --- | --- |
| --- | ---: | ---: | ---: | ---: |
| JS Runtime / 语法 / 标准库 | 363 | 344 | 19 | 0 |
| 项目漏测补充项 | 49 | 43 | 6 | 0 |
| Frida 官方 API Active | 139 | 122 | 17 | 0 |

总体结论：

- 现代 JS 语法支持很好，ES6+ 大部分可用。
- 当前环境不是 Node.js，也不是浏览器环境。
- CommonJS、Node 模块、浏览器 API 不要依赖。
- Frida 常用 API 大部分可用，包括 `Memory`、`NativePointer`、`NativeFunction`、`Interceptor`、`File`、`Script`、`Process`、`ModuleMap`、`DebugSymbol`、`Socket`、`Sqlite`、`CModule`、`Stalker` 等。
- 模块拆分可以用 `globalThis` 显式导出，也可以继续研究 `Script.load()` 的 ES module 方式。
- `Module.getGlobalExportByName()` 不存在，应该使用 `Module.getExportByName(null, name)` 或 `Module.findExportByName(null, name)`。
- 平台相关 API 需要按当前 Linux 服务端环境判断，例如 `Java`、`ObjC`、`Kernel` 当前不可用。

---

## 一句话规则

```
可以写现代 JS，但不能按 Node.js / 浏览器 JS 来写。
Frida API 大部分可用，但模块系统、浏览器 API、平台相关 API 要特别区分。
```

最重要的工程规则：

```
1. 普通 JS / ES6+ 基本可用。
2. 不要用 require / module.exports / exports。
3. 不要依赖浏览器 API：fetch / URL / TextEncoder / Intl 等。
4. 不要用 Module.getGlobalExportByName。
5. 查系统导出用 Module.getExportByName(null, name)。
6. eval 加载的 function / var 不会自动全局可见，模块必须 globalThis 显式导出。
7. NativeFunction varargs 可以用，但写法必须正确，参数类型标记不能放到调用参数里。
8. Java / ObjC / Kernel 当前 Linux 服务端环境不可用。
```

---

## 可以放心使用的 JS 语法

### ES5 / 基础语法

以下都通过：

- `var`
- `function` 声明
- 函数表达式
- 对象字面量
- 数组字面量
- 点属性访问
- 方括号属性访问
- `if / else`
- `for`
- `for...in`
- `while`
- `do...while`
- `switch`
- `try / catch / finally`
- `typeof`
- 三元表达式
- 逻辑运算符
- 位运算符
- `delete`
- `in`
- `instanceof`
- `new`
- `prototype`
- `this`
- `call / apply / bind`
- getter / setter
- `Object.defineProperty`
- `Object.create`
- `Object.keys`
- `Object.getOwnPropertyNames`
- `Object.freeze`
- `Array.isArray`
- `Date`
- `Math`
- `isNaN`
- 正则字面量
- 正则捕获
- label / break / continue
- `JSON.stringify / JSON.parse`
- `parseInt`

### ES6+ / 现代语法

以下都通过：

- `let`
- `const`
- 块级作用域
- TDZ
- 模板字符串
- 多行模板字符串
- tagged template
- 箭头函数
- 箭头函数 lexical `this`
- 默认参数
- rest 参数
- 数组 spread
- 函数调用 spread
- 对象 spread
- 对象 rest
- 数组解构
- 对象解构
- 嵌套解构
- 默认值解构
- 参数解构
- 对象属性简写
- 对象方法简写
- 计算属性名
- `class`
- `extends`
- `super`
- static method
- private field
- private method
- public class field
- static class field
- static block
- generator
- `yield*`
- `for...of`
- `Symbol.iterator`
- unicode code point escape
- binary numeric literal
- octal numeric literal
- exponentiation operator `**`
- `async function`
- `async/await` 语法
- async arrow function
- trailing comma in function params
- optional catch binding
- optional chaining
- optional chaining call
- nullish coalescing `??`
- logical assignment `&&= / ||= / ??=`
- numeric separators
- BigInt literal
- RegExp named capture groups
- RegExp lookbehind
- RegExp dotAll `s` flag
- RegExp unicode `u` flag
- RegExp sticky `y` flag
- RegExp indices `d` flag
- dynamic `import()` 编译与执行

### 不支持 / 不建议的语法

这些失败：

```
RegExp unicodeSets v flag
static import in Function
static export in Function
import.meta in Function
top-level await in Function
decorator proposal
```

不要这样写：

```jsx
import x from './x.js';
export default 1;
import.meta.url;
await Promise.resolve(1);
@decorator
class A {}
```

说明：

- static import/export 是 module code 语法，不能直接放进 `Function()` 或普通 `eval()` 场景。
- `Script.load()` 可以加载 ES module，这和普通 `eval()` 不是同一个机制。

---

## 标准对象与标准方法

### 可用内置对象

以下可用：

- `globalThis`
- `console`
- `JSON`
- `Math`
- `Date`
- `RegExp`
- `Error`
- `EvalError`
- `RangeError`
- `ReferenceError`
- `SyntaxError`
- `TypeError`
- `URIError`
- `AggregateError`
- `Map`
- `Set`
- `WeakMap`
- `WeakSet`
- `Proxy`
- `Reflect`
- `Promise`
- `Symbol`
- `BigInt`
- `ArrayBuffer`
- `SharedArrayBuffer`
- `DataView`
- `TypedArray`
- `WeakRef`

### 不存在的浏览器 / Node 风格对象

以下在当前 Frida QJS 环境中是 `undefined` 或行为测试失败：

- `TextEncoder`
- `TextDecoder`
- `URL`
- `URLSearchParams`
- `atob`
- `btoa`
- `fetch`
- `queueMicrotask`
- `FinalizationRegistry`
- `structuredClone`
- `WebAssembly`
- `Intl`
- `Atomics`

规则：

```
不要把 Frida JS 当浏览器环境或 Node.js 环境。
```

---

## 常用标准方法

### Object

以下通过：

- `Object.assign`
- `Object.keys`
- `Object.values`
- `Object.entries`
- `Object.fromEntries`
- `Object.is`
- `Object.hasOwn`
- `Object.getOwnPropertyDescriptors`
- `Object.defineProperties`
- `Object.freeze`
- `Object.seal`
- `Object.preventExtensions`

### Array

以下通过：

- `Array.from`
- `Array.of`
- `forEach`
- `map`
- `filter`
- `reduce`
- `some`
- `every`
- `find`
- `findIndex`
- `findLast`
- `findLastIndex`
- `includes`
- `flat`
- `flatMap`
- `at`
- `copyWithin`
- `fill`
- `keys`
- `values`
- `entries`
- `toReversed`
- `toSorted`
- `toSpliced`
- `with`
- `push`
- `pop`
- `shift`
- `unshift`
- `splice`
- `sort`
- `slice`

### String

以下通过：

- `includes`
- `startsWith`
- `endsWith`
- `repeat`
- `padStart`
- `padEnd`
- `trim`
- `trimStart`
- `trimEnd`
- `replaceAll`
- `matchAll`
- `at`
- `normalize`
- `codePointAt`
- `String.fromCodePoint`
- `String.raw`
- `split`
- `slice`
- `substring`
- `indexOf`
- `String(value)`
- `Number.toString(radix)`

### Number / Math

以下通过：

- `Number.isNaN`
- `Number.isFinite`
- `Number.isInteger`
- `Number.isSafeInteger`
- `Number.parseInt`
- `Number.parseFloat`
- `Number.EPSILON`
- `Number.MAX_SAFE_INTEGER`
- `Math.trunc`
- `Math.sign`
- `Math.hypot`
- `Math.imul`
- `Math.clz32`
- `Math.fround`
- `Math.log2`
- `Math.log10`
- `Math.cbrt`

---

## 模块系统结论

### 不可用：CommonJS

以下不可用：

```jsx
require('./a.js');
module.exports = {};
exports.start = start;
```

测试结果：

```
require: undefined
module: undefined
exports: undefined
```

结论：

```
不能按 Node.js CommonJS 写模块。
```

### 普通 eval 加载模块的坑

`eval(code)` 可以执行代码，但如果在函数内部执行，模块里的 `function` 和 `var` 不会自动暴露为全局变量。

失败场景：

```jsx
function loader() {
  eval('function startRanking() { return 1; }');
}

loader();
typeof startRanking; // undefined
```

同样，下面也不会自动变全局：

```jsx
function loader() {
  eval('var rankingList = {};');
}

loader();
typeof rankingList; // undefined
```

正确写法：

```jsx
globalThis.startRanking = function () {
  return 1;
};
```

或者：

```jsx
(function () {
  function startRanking() {
    return 1;
  }

  globalThis.startRanking = startRanking;
})();
```

### 推荐模块注册方式

推荐统一挂到命名空间：

```jsx
globalThis.DP2 = globalThis.DP2 || {};
globalThis.DP2.modules = globalThis.DP2.modules || {};
```

模块文件：

```jsx
(function () {
  var moduleApi = {};

  moduleApi.start = function () {
    console.log('[ranking] started');
  };

  moduleApi.update = function (user) {
    console.log('[ranking] update user=' + user);
  };

  globalThis.DP2 = globalThis.DP2 || {};
  globalThis.DP2.modules = globalThis.DP2.modules || {};
  globalThis.DP2.modules.ranking = moduleApi;
})();
```

主文件调用：

```jsx
dp_load('ranking');

if (
  globalThis.DP2 &&
  globalThis.DP2.modules &&
  globalThis.DP2.modules.ranking &&
  typeof globalThis.DP2.modules.ranking.start === 'function'
) {
  globalThis.DP2.modules.ranking.start();
}
```

### `Script.load()` 可用

本次 active 测试确认：

```
Script.load ES module: OK
namespace.value=42
name=module-ok
```

这说明 `Script.load()` 可以作为后续升级方向，用于更接近 ES module 的加载方式。

不过当前工程里如果想稳，仍建议优先使用：

```
api_read_file + eval + globalThis 显式导出
```

如果要迁移到 `Script.load()`，需要单独设计异步加载流程，因为它返回 Promise。

---

## Frida Runtime / Script

以下通过：

- `Frida.version`
- `Frida.heapSize`
- `Script.runtime`
- `Script.evaluate()`
- `Script.load()`
- `Script.registerSourceMap()`
- `Script.nextTick()`
- `Script.pin()`
- `Script.unpin()`
- `Script.bindWeak()`
- `Script.unbindWeak()`
- `Script.setGlobalAccessHandler()`

环境结果：

```
Frida.version = 16.3.1
Script.runtime = QJS
```

---

## Process / Thread

### 可用

以下通过：

- `Process.id`
- `Process.arch`
- `Process.platform`
- `Process.pointerSize`
- `Process.pageSize`
- `Process.codeSigningPolicy`
- `Process.mainModule`
- `Process.getCurrentDir()`
- `Process.getHomeDir()`
- `Process.getTmpDir()`
- `Process.isDebuggerAttached()`
- `Process.getCurrentThreadId()`
- `Process.findModuleByAddress()`
- `Process.getModuleByAddress()`
- `Process.findModuleByName()`
- `Process.getModuleByName()`
- `Process.findRangeByAddress()`
- `Process.getRangeByAddress()`
- `Process.enumerateRanges()`
- `Process.enumerateModules()`
- `Process.enumerateThreads()`
- `Process.runOnThread()`
- `Process.setExceptionHandler()`
- `Thread.backtrace()`

实际环境示例：

```
Process.mainModule = df_game_r
Process.mainModule.base = 0x8048000
Process.mainModule.size = 21743072
Process.getCurrentDir() = /home/neople/game
Process.getHomeDir() = /root
Process.getTmpDir() = /tmp
Process.pageSize = 4096
Process.codeSigningPolicy = optional
```

### 失败 / 不适用

- `Process.enumerateMallocRanges()`：Linux 下不可用或当前环境未实现。
- `Process.attachThreadObserver detach`：返回对象没有按预期暴露 detach。
- `Process.attachModuleObserver detach`：返回对象没有按预期暴露 detach。

规则：

```
Process 查询类 API 基本可用。
observer 类 API 需要单独验证返回对象行为。
```

---

## Module / ModuleMap

### 推荐使用

```jsx
Module.getExportByName(null, name);
Module.findExportByName(null, name);
```

系统函数查找通过：

- `opendir`
- `mkdir`
- `fopen`
- `fread`
- `fclose`
- `getpid`
- `strlen`

### 不要使用旧 API

这些不存在：

```jsx
Module.getGlobalExportByName(name);
Module.findGlobalExportByName(name);
Module.enumerateModules();
```

替代方案：

```jsx
Process.enumerateModules();
Module.getExportByName(null, name);
Module.findExportByName(null, name);
```

### 指定 so 查符号

失败：

```jsx
Module.getExportByName('libdp2.so', 'dp2_frida_resolver');
Module.findExportByName('libdp2.so', 'dp2_frida_resolver');
```

说明：

```
当前进程中没有通过这个方式找到 dp2_frida_resolver。
不能直接假设 libdp2.so 内一定有该导出符号。
```

### Module object

部分可用，部分不存在。

可用：

- module 基础字段：`name / base / size / path`
- `enumerateImports()`
- `enumerateExports()`
- `enumerateSymbols()`
- `enumerateRanges()`
- `enumerateSections()`
- `enumerateDependencies()`
- `findExportByName()`
- `getExportByName()`

失败 / 不存在：

- `module.ensureInitialized()`
- `module.findSymbolByName()`
- `module.getSymbolByName()`

### ModuleMap

以下通过：

- `new ModuleMap()`
- `values()`
- `has(address)`
- `find(address)`
- `get(address)`
- `findName(address)`
- `getName(address)`
- `findPath(address)`
- `getPath(address)`
- `update()`

示例结果：

```
ModuleMap.values() = 12
findName(Process.mainModule.base) = df_game_r
getPath(Process.mainModule.base) = /home/neople/game/df_game_r
```

---

## Memory

### 可用

以下通过：

- `Memory.alloc()`
- `Memory.allocUtf8String()`
- `Memory.allocUtf16String()`
- `Memory.protect()`
- `Memory.copy()`
- `Memory.dup()`
- `Memory.queryProtection()`
- `Memory.scanSync()`
- `Memory.scan()`
- `Memory.patchCode()`

示例结论：

```
Memory.queryProtection(ptr) => rw-
Memory.scanSync allocated memory => count=1
Memory.scan async allocated memory => count=1
Memory.patchCode allocated page => OK
```

### 不适用 / 失败

- `Memory.allocAnsiString()`：Windows-only，当前 Linux 环境不可用。
- `MemoryAccessMonitor.enable()`：当前测试触发 access violation，需要单独换更安全的触发方式再测。

规则：

```
普通 Memory API 可以用。
patchCode 已在测试服验证可用，但业务中仍要谨慎。
MemoryAccessMonitor 不能按当前测试方式直接使用。
```

---

## NativePointer

### 常用读写可用

以下通过：

- `readU8 / writeU8`
- `readU16 / writeU16`
- `readU32 / writeU32`
- `readUInt / writeUInt`
- `readShort / writeShort`
- `readUShort / writeUShort`
- `readS8 / writeS8`
- `readS16 / writeS16`
- `readS32 / writeS32`
- `readFloat / writeFloat`
- `readDouble / writeDouble`
- `readPointer / writePointer`
- `readLong / writeLong`
- `readULong / writeULong`
- `readS64 / writeS64`
- `readU64 / writeU64`
- `readByteArray()`
- `writeByteArray()`
- `readCString()`
- `readUtf8String()`
- `writeUtf8String()`
- `readUtf16String()`
- `writeUtf16String()`
- `readVolatile()`
- `toInt32()`
- `add()`
- `sub()`
- `equals()`
- `compare()`
- `toMatchPattern()`
- `and()`
- `or()`
- `xor()`
- `shl()`
- `shr()`
- `not()`

### 不可用

- `writeVolatile()`：当前 `NativePointer.writeVolatile` 不存在。

### 存在性通过

- `sign()`
- `strip()`
- `blend()`

这些是架构相关能力，当前仅确认方法存在，不建议在 ia32 业务里作为核心能力依赖。

---

## NativeFunction / NativeCallback / SystemFunction

### 常用类型可用

以下通过：

- `void`
- `bool`
- `int`
- `uint`
- `uint8`
- `uint16`
- `int8`
- `int16`
- `int32`
- `uint32`
- `int64`
- `uint64`
- `long`
- `ulong`
- `char`
- `uchar`
- `size_t`
- `ssize_t`
- `float`
- `double`
- `pointer`

### NativeFunction options 可用

以下通过：

```jsx
new NativeFunction(strlen, 'int', ['pointer'], { scheduling: 'exclusive' });
new NativeFunction(strlen, 'int', ['pointer'], { exceptions: 'steal' });
```

### varargs 正确写法

旧探针里的错误写法失败：

```jsx
snprintf(buf, 64, fmt, 'int', 7, 'pointer', text); // wrong
```

正确写法在 active 官方探针里已通过：

```jsx
var snprintf = new NativeFunction(
  snprintfAddr,
  'int',
  ['pointer', 'uint', 'pointer', '...', 'int', 'pointer']
);

snprintf(buf, 64, fmt, 7, text);
```

结果：

```
n=13
text=num=7 text=ok
```

规则：

```
NativeFunction varargs 可以用，但类型必须写在 NativeFunction 的 argTypes 中。
调用时不要把 'int' / 'pointer' 这种类型字符串作为参数传进去。
```

### SystemFunction

以下通过：

```jsx
new SystemFunction(strlen, 'int', ['pointer']);
```

返回包含：

```
value=5
errno=0
```

---

## Interceptor

以下通过：

- `Interceptor.attach()`
- `Interceptor.replace()`
- `Interceptor.revert()`
- `Interceptor.flush()`
- `Interceptor.replaceFast()`
- `Interceptor.detachAll()`

测试结果示例：

```
Interceptor.attach getpid => hit=1
Interceptor.replace getpid => result=123456
Interceptor.replaceFast active callback target => OK
Interceptor.detachAll => true
```

注意：

```
Interceptor.detachAll() 会解除当前脚本的所有 hook。
业务脚本中不要随意调用，只适合测试或清理阶段。
```

---

## File / Stream / Socket / Sqlite

### File 完整 API 可用

以下通过：

- `new File(path, 'w')`
- `new File(path, 'a+')`
- `write()`
- `flush()`
- `close()`
- `File.writeAllText()`
- `File.readAllText()`
- `File.writeAllBytes()`
- `File.readAllBytes()`
- `tell()`
- `seek()`
- `readLine()`
- `readText()`
- `readBytes()`

### Stream API 存在

以下存在：

- `IOStream`
- `InputStream`
- `OutputStream`
- `UnixInputStream`
- `UnixOutputStream`

### Socket 可用

以下通过：

- `Socket.listen()`
- `Socket.connect` 存在
- `Socket.type()`
- `Socket.localAddress()`
- `Socket.peerAddress()`

active 测试中本地监听成功：

```
Socket.listen localhost => listener port=33657
```

### Sqlite 可用

以下通过：

- `SqliteDatabase.open()`
- `exec()`
- `select()`
- `close()`

注意：

```
SqliteStatement 在当前环境中未暴露为独立全局构造器。
```

---

## DebugSymbol / ApiResolver / Instruction / CPU Writer

### DebugSymbol 可用

以下通过：

- `DebugSymbol.fromAddress()`
- `DebugSymbol.fromName()`
- `DebugSymbol.findFunctionsNamed()`
- `DebugSymbol.findFunctionsMatching()`

示例：

```
DebugSymbol.fromAddress(strlen) => libc-2.17.so!__strlen_sse2_bsf
DebugSymbol.findFunctionsMatching('*strlen*') => 6
```

### ApiResolver 可用，但匹配结果要看模式

`ApiResolver('module')` 可用。测试 `exports:*!strlen*` 返回 0，说明匹配模式或符号暴露方式需要结合实际模块调整。

### Instruction.parse 可用

```
Instruction.parse(Process.mainModule.base) => jg 0x8048047
```

### CPU Writer

当前 ia32 环境：

- `X86Writer` 可用
- `X86Relocator` 可用
- ARM / ARM64 / MIPS writer 不存在，符合平台预期

`X86Writer` active 测试通过。

---

## CModule / RustModule / Worker / Stalker / Cloak / GC

### CModule 可用

```
CModule active compile => OK
```

### RustModule 不可用

```
RustModule: undefined
```

### Worker 存在，但当前测试创建失败

```
Worker: function
Worker active creation => invalid URL
```

判断：

```
Worker 全局存在，但本次测试使用本地路径方式不符合 Worker URL 要求。
不能直接判定 Worker 完全不可用，需要单独用合法 URL 方式再测。
```

### Stalker 可用

以下通过：

- `Stalker.follow()`
- `Stalker.unfollow()`
- `Stalker.flush()`
- `Stalker.garbageCollect()`
- 当前线程 follow/unfollow active 测试通过

注意：

```
Stalker 是高开销指令级跟踪能力，业务服不建议常驻启用。
```

### Cloak 可用

以下存在：

- `Cloak.addThread`
- `Cloak.removeThread`
- `Cloak.hasThread`
- `Cloak.addRange`
- `Cloak.removeRange`

### gc / hexdump 可用

以下通过：

- `gc()`
- `hexdump()`

---

## 平台相关 API

当前是 Linux ia32 游戏服务端进程，所以这些不适用：

### Kernel

```
Kernel.available = false
Kernel.enumerateModules => FAIL
```

### Java

```
Java.available = false
Java.perform => FAIL
```

### ObjC

```
ObjC.available = false
ObjC.classes => FAIL
```

### Profiler / Sampler

以下不存在：

- `Profiler`
- `Sampler`
- `CycleSampler`
- `BusyCycleSampler`
- `WallClockSampler`
- `UserTimeSampler`
- `MallocCountSampler`
- `CallCountSampler`

结论：

```
Java / ObjC / Kernel / Profiler / Sampler 当前环境不要用。
```

---

## 失败项分类

### 真正不要依赖

```
require
module
exports
static import in Function
static export in Function
import.meta in Function
top-level await in Function
RegExp v flag
decorator
TextEncoder
TextDecoder
URL
URLSearchParams
atob
btoa
fetch
queueMicrotask
structuredClone
Intl
WebAssembly
FinalizationRegistry
Module.getGlobalExportByName
Module.findGlobalExportByName
Module.enumerateModules
NativePointer.writeVolatile
```

### 平台不适用

```
Memory.allocAnsiString
Kernel.*
Java.*
ObjC.*
RustModule
Profiler
Sampler
ARM / ARM64 / MIPS writer
```

### 需要修正测试方式或单独复测

```
MemoryAccessMonitor.enable
Worker active creation
Process.attachThreadObserver detach
Process.attachModuleObserver detach
setTimeout extra args in full active combined run
ApiResolver exports pattern matching
```

说明：

- `setTimeout(fn, delay, arg1, arg2)` 在单独补充探针中通过，在全量 active 合并跑时因为超时被标记失败，更像是重负载干扰，不建议判定为不可用。
- `MemoryAccessMonitor` 失败是测试地址访问方式导致 access violation，需要换更安全的触发方式复测。
- `Worker` 失败是 invalid URL，需要按 Frida Worker 支持的合法 URL 格式复测。

---

## 推荐写法

### 系统函数查找

推荐：

```jsx
function getSystemExportAddress(name) {
  var address = null;

  if (typeof Module.getExportByName === 'function') {
    return Module.getExportByName(null, name);
  }

  if (typeof Module.findExportByName === 'function') {
    address = Module.findExportByName(null, name);
    if (address) {
      return address;
    }
  }

  throw new Error('system export not found: ' + name);
}
```

不推荐：

```jsx
Module.getGlobalExportByName('strlen');
```

### 模块导出

推荐：

```jsx
globalThis.DP2 = globalThis.DP2 || {};
globalThis.DP2.modules = globalThis.DP2.modules || {};

globalThis.DP2.modules.ranking = {
  start: function () {
    console.log('[ranking] start');
  }
};
```

不推荐：

```jsx
function startRanking() {}
```

然后指望 `eval()` 后它自动全局可见。

### NativeFunction varargs

推荐：

```jsx
var snprintf = new NativeFunction(
  snprintfAddr,
  'int',
  ['pointer', 'uint', 'pointer', '...', 'int', 'pointer']
);

snprintf(buf, 64, fmt, 7, text);
```

错误：

```jsx
snprintf(buf, 64, fmt, 'int', 7, 'pointer', text);
```

### File 读写

可以用：

```jsx
File.writeAllText('/tmp/a.txt', 'hello');
var text = File.readAllText('/tmp/a.txt');

var f = new File('/tmp/a.log', 'a+');
f.write('line\n');
f.flush();
f.close();
```

### Memory 扫描

可以用：

```jsx
var p = Memory.alloc(8);
p.writeByteArray([0x11, 0x22, 0x33, 0x44, 0, 0, 0, 0]);
var matches = Memory.scanSync(p, 8, '11 22 33 44');
```

---

## 最终建议

当前 Frida 环境可以按下面方式组织工程：

```
1. 单文件或多文件都可以。
2. 多文件不要用 CommonJS。
3. 稳定方案：api_read_file + eval + globalThis.DP2.modules 显式导出。
4. 进阶方案：研究 Script.load()，但要处理 Promise 异步加载。
5. Frida 系统导出查找统一用 Module.getExportByName(null, name)。
6. 内存读写、文件读写、hook、patchCode、Stalker、CModule 等能力测试服都已验证可用。
7. 业务代码不要依赖浏览器 API / Node API / 平台不适用 API。
```

最终判断：

```
当前环境的 JS 语法能力很强，Frida 核心 API 覆盖完整。
后续重构主要问题不是语法兼容性，而是模块组织方式和 Frida API 版本差异。
```