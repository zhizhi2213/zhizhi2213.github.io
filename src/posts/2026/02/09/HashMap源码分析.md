---
title: "HashMap源码分析"
date: 2026-02-09 00:00:00
tags:
---
# HashMap 源码分析

## 一、HashMap 简介

HashMap 是 Java 中最常用的集合类之一，它基于哈希表实现，提供了快速的键值对存储和查找功能。HashMap 允许使用 null 键和 null 值，并且不保证映射的顺序。

### 主要特点

- 键值对存储，基于哈希表实现
- 允许 null 键和 null 值
- 非线程安全，适用于单线程环境
- 默认初始容量为 16，默认负载因子为 0.75
- 扩容时容量变为原来的 2 倍
- 时间复杂度：平均 O(1)，最坏 O(n)

## 二、核心数据结构

### 2.1 Node 节点

HashMap 的每个元素都是一个 Node 对象，Node 是 HashMap 的静态内部类：

```java
static class Node<K,V> implements Map.Entry<K,V> {
    final int hash;
    final K key;
    V value;
    Node<K,V> next;

    Node(int hash, K key, V value, Node<K,V> next) {
        this.hash = hash;
        this.key = key;
        this.value = value;
        this.next = next;
    }

    public final K getKey() { return key; }
    public final V getValue() { return value; }
    public final String toString() { return key + "=" + value; }

    public final int hashCode() {
        return Objects.hashCode(key) ^ Objects.hashCode(value);
    }

    public final V setValue(V newValue) {
        V oldValue = value;
        value = newValue;
        return oldValue;
    }

    public final boolean equals(Object o) {
        if (o == this)
            return true;
        if (o instanceof Map.Entry) {
            Map.Entry<?,?> e = (Map.Entry<?,?>)o;
            if (Objects.equals(key, e.getKey()) &&
                Objects.equals(value, e.getValue()))
                return true;
        }
        return false;
    }
}
```

### 2.2 底层结构

HashMap 的底层结构是一个数组 + 链表 + 红黑树：

```java
public class HashMap<K,V> extends AbstractMap<K,V>
    implements Map<K,V>, Cloneable, Serializable {

    transient Node<K,V>[] table;  // 哈希桶数组

    transient Set<Map.Entry<K,V>> entrySet;

    transient int size;  // 实际存储的键值对数量

    transient int modCount;  // 结构性修改次数

    final float loadFactor;  // 负载因子

    int threshold;  // 扩容阈值 = capacity * loadFactor
}
```

## 三、关键参数

### 3.1 初始参数

```java
static final int DEFAULT_INITIAL_CAPACITY = 1 << 4;  // 默认初始容量 16
static final int MAXIMUM_CAPACITY = 1 << 30;  // 最大容量
static final float DEFAULT_LOAD_FACTOR = 0.75f;  // 默认负载因子
static final int TREEIFY_THRESHOLD = 8;  // 链表转红黑树的阈值
static final int UNTREEIFY_THRESHOLD = 6;  // 红黑树转链表的阈值
static final int MIN_TREEIFY_CAPACITY = 64;  // 桶转树的最小容量
```

### 3.2 构造方法

```java
public HashMap(int initialCapacity, float loadFactor) {
    if (initialCapacity < 0)
        throw new IllegalArgumentException("Illegal initial capacity: " +
                                           initialCapacity);
    if (initialCapacity > MAXIMUM_CAPACITY)
        initialCapacity = MAXIMUM_CAPACITY;
    if (loadFactor <= 0 || Float.isNaN(loadFactor))
        throw new IllegalArgumentException("Illegal load factor: " +
                                           loadFactor);
    this.loadFactor = loadFactor;
    this.threshold = tableSizeFor(initialCapacity);
}

public HashMap(int initialCapacity) {
    this(initialCapacity, DEFAULT_LOAD_FACTOR);
}

public HashMap() {
    this.loadFactor = DEFAULT_LOAD_FACTOR;
}
```

### 3.3 tableSizeFor 方法

这个方法用于将给定的容量调整为 2 的 n 次幂：

```java
static final int tableSizeFor(int cap) {
    int n = cap - 1;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    return (n < 0) ? 1 : (n >= MAXIMUM_CAPACITY) ? MAXIMUM_CAPACITY : n + 1;
}
```

这个方法通过一系列的位运算，将最高位的 1 后面的所有位都置为 1，然后加 1，得到一个 2 的 n 次幂。

## 四、Hash 算法

### 4.1 hash 方法

HashMap 通过 hash 方法计算 key 的哈希值：

```java
static final int hash(Object key) {
    int h;
    return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
}
```

**为什么要进行异或操作？**

- `h >>> 16` 将哈希值的高 16 位无符号右移 16 位
- `^` 操作将高 16 位和低 16 位进行异或
- 这样做的好处是让高位的特征也能参与到低位的运算中，减少哈希冲突

### 4.2 索引计算

通过 hash 值计算在数组中的索引位置：

```java
index = (n - 1) & hash
```

其中 n 是数组长度，必须是 2 的 n 次幂。

**为什么使用位运算而不是取模？**

- 位运算效率更高
- 当 n 是 2 的 n 次幂时，`(n - 1) & hash` 等价于 `hash % n`
- `(n - 1)` 的二进制表示是全 1，如 16-1=15，二进制为 1111

## 五、put 方法源码分析

### 5.1 put 方法入口

```java
public V put(K key, V value) {
    return putVal(hash(key), key, value, false, true);
}
```

### 5.2 putVal 方法详解

```java
final V putVal(int hash, K key, V value, boolean onlyIfAbsent,
               boolean evict) {
    Node<K,V>[] tab;
    Node<K,V> p;
    int n, i;

    // 1. 如果 table 为空或长度为 0，进行初始化
    if ((tab = table) == null || (n = tab.length) == 0)
        n = (tab = resize()).length;

    // 2. 计算索引位置，如果该位置为空，直接插入新节点
    if ((p = tab[i = (n - 1) & hash]) == null)
        tab[i] = newNode(hash, key, value, null);
    else {
        Node<K,V> e;
        K k;

        // 3. 判断该位置的第一个节点是否与要插入的 key 相同
        if (p.hash == hash &&
            ((k = p.key) == key || (key != null && key.equals(k))))
            e = p;

        // 4. 如果是红黑树节点，调用红黑树的插入方法
        else if (p instanceof TreeNode)
            e = ((TreeNode<K,V>)p).putTreeVal(this, tab, hash, key, value);

        // 5. 否则是链表，遍历链表
        else {
            for (int binCount = 0; ; ++binCount) {
                // 到达链表尾部，插入新节点
                if ((e = p.next) == null) {
                    p.next = newNode(hash, key, value, null);
                    // 链表长度达到 8，转为红黑树
                    if (binCount >= TREEIFY_THRESHOLD - 1)
                        treeifyBin(tab, hash);
                    break;
                }

                // 找到相同的 key
                if (e.hash == hash &&
                    ((k = e.key) == key || (key != null && key.equals(k))))
                    break;

                p = e;
            }
        }

        // 6. 如果找到相同的 key，覆盖旧值
        if (e != null) {
            V oldValue = e.value;
            if (!onlyIfAbsent || oldValue == null)
                e.value = value;
            afterNodeAccess(e);
            return oldValue;
        }
    }

    ++modCount;
    // 7. 判断是否需要扩容
    if (++size > threshold)
        resize();
    afterNodeInsertion(evict);
    return null;
}
```

## 六、get 方法源码分析

### 6.1 get 方法入口

```java
public V get(Object key) {
    Node<K,V> e;
    return (e = getNode(hash(key), key)) == null ? null : e.value;
}
```

### 6.2 getNode 方法详解

```java
final Node<K,V> getNode(int hash, Object key) {
    Node<K,V>[] tab;
    Node<K,V> first, e;
    int n;
    K k;

    // 1. 检查 table 是否为空
    if ((tab = table) != null && (n = tab.length) > 0 &&
        (first = tab[(n - 1) & hash]) != null) {

        // 2. 检查第一个节点是否匹配
        if (first.hash == hash &&
            ((k = first.key) == key || (key != null && key.equals(k))))
            return first;

        // 3. 检查后续节点
        if ((e = first.next) != null) {
            // 如果是红黑树，在红黑树中查找
            if (first instanceof TreeNode)
                return ((TreeNode<K,V>)first).getTreeNode(hash, key);

            // 在链表中查找
            do {
                if (e.hash == hash &&
                    ((k = e.key) == key || (key != null && key.equals(k))))
                    return e;
            } while ((e = e.next) != null);
        }
    }
    return null;
}
```

## 七、扩容机制（resize）

### 7.1 resize 方法详解

```java
final Node<K,V>[] resize() {
    Node<K,V>[] oldTab = table;
    int oldCap = (oldTab == null) ? 0 : oldTab.length;
    int oldThr = threshold;
    int newCap, newThr = 0;

    // 1. 计算新容量和新阈值
    if (oldCap > 0) {
        if (oldCap >= MAXIMUM_CAPACITY) {
            threshold = Integer.MAX_VALUE;
            return oldTab;
        }
        else if ((newCap = oldCap << 1) < MAXIMUM_CAPACITY &&
                 oldCap >= DEFAULT_INITIAL_CAPACITY)
            newThr = oldThr << 1;
    }
    else if (oldThr > 0)
        newCap = oldThr;
    else {
        newCap = DEFAULT_INITIAL_CAPACITY;
        newThr = (int)(DEFAULT_LOAD_FACTOR * DEFAULT_INITIAL_CAPACITY);
    }

    if (newThr == 0) {
        float ft = (float)newCap * loadFactor;
        newThr = (newCap < MAXIMUM_CAPACITY && ft < MAXIMUM_CAPACITY ?
                  (int)ft : Integer.MAX_VALUE);
    }
    threshold = newThr;

    // 2. 创建新数组
    @SuppressWarnings({"rawtypes","unchecked"})
    Node<K,V>[] newTab = (Node<K,V>[])new Node[newCap];
    table = newTab;

    // 3. 迁移旧数组中的元素
    if (oldTab != null) {
        for (int j = 0; j < oldCap; ++j) {
            Node<K,V> e;
            if ((e = oldTab[j]) != null) {
                oldTab[j] = null;
                if (e.next == null)
                    newTab[e.hash & (newCap - 1)] = e;
                else if (e instanceof TreeNode)
                    ((TreeNode<K,V>)e).split(this, newTab, j, oldCap);
                else {
                    // 链表优化：将链表分为原索引和原索引+oldCap两个位置
                    Node<K,V> loHead = null, loTail = null;
                    Node<K,V> hiHead = null, hiTail = null;
                    Node<K,V> next;
                    do {
                        next = e.next;
                        if ((e.hash & oldCap) == 0) {
                            if (loTail == null)
                                loHead = e;
                            else
                                loTail.next = e;
                            loTail = e;
                        }
                        else {
                            if (hiTail == null)
                                hiHead = e;
                            else
                                hiTail.next = e;
                            hiTail = e;
                        }
                    } while ((e = next) != null);

                    if (loTail != null) {
                        loTail.next = null;
                        newTab[j] = loHead;
                    }
                    if (hiTail != null) {
                        hiTail.next = null;
                        newTab[j + oldCap] = hiHead;
                    }
                }
            }
        }
    }
    return newTab;
}
```

### 7.2 扩容优化

JDK 1.8 对扩容进行了优化：

- 使用 `(e.hash & oldCap)` 判断元素是在原位置还是移动到 `原位置 + oldCap`
- 这样可以避免重新计算 hash，提高效率
- 例如：原容量 16（10000），扩容后 32（100000）
  - 如果 `(e.hash & 16) == 0`，索引不变
  - 如果 `(e.hash & 16) != 0`，索引 = 原索引 + 16

## 八、红黑树转换

### 8.1 treeifyBin 方法

当链表长度达到 8 时，尝试将链表转为红黑树：

```java
final void treeifyBin(Node<K,V>[] tab, int hash) {
    int n, index;
    Node<K,V> e;

    // 如果数组长度小于 64，先扩容而不是转树
    if (tab == null || (n = tab.length) < MIN_TREEIFY_CAPACITY)
        resize();

    else if ((e = tab[index = (n - 1) & hash]) != null) {
        TreeNode<K,V> hd = null, tl = null;
        do {
            TreeNode<K,V> p = replacementTreeNode(e, null);
            if (tl == null)
                hd = p;
            else {
                p.prev = tl;
                tl.next = p;
            }
            tl = p;
        } while ((e = e.next) != null);

        if ((tab[index] = hd) != null)
            hd.treeify(tab);
    }
}
```

### 8.2 为什么是 8 和 6？

- **8 转 16**：链表转红黑树
- **6 转 16**：红黑树转链表

这样设计是为了避免频繁转换：

- 根据泊松分布，链表长度达到 8 的概率非常小（0.00000006）
- 当长度在 6-8 之间波动时，不会频繁转换
- 这是一种空间和时间的权衡

## 九、线程安全问题

HashMap 是非线程安全的，在多线程环境下会出现以下问题：

### 9.1 并发扩容问题

JDK 1.7 中使用头插法，并发扩容可能导致链表形成环：

```java
void transfer(Entry[] newTable, boolean rehash) {
    int newCapacity = newTable.length;
    for (Entry<K,V> e : table) {
        while(null != e) {
            Entry<K,V> next = e.next;
            if (rehash) {
                e.hash = null == e.key ? 0 : hash(e.key);
            }
            int i = indexFor(e.hash, newCapacity);
            e.next = newTable[i];
            newTable[i] = e;
            e = next;
        }
    }
}
```

### 9.2 JDK 1.8 的改进

- 改用尾插法，避免了链表环的问题
- 但仍然存在数据丢失和覆盖的问题

### 9.3 解决方案

如果需要在多线程环境下使用，可以使用：

- **ConcurrentHashMap**：线程安全的 HashMap
- **Collections.synchronizedMap(new HashMap<>())**：使用同步包装器
- **Hashtable**：线程安全的遗留类（不推荐）

## 十、常见面试题

### 1. HashMap 的底层数据结构？

JDK 1.7：数组 + 链表
JDK 1.8：数组 + 链表 + 红黑树

### 2. 为什么 JDK 1.8 要引入红黑树？

为了解决链表过长导致的查询效率问题。当链表长度超过 8 时，查询时间复杂度从 O(n) 降低到 O(log n)。

### 3. HashMap 的扩容机制是什么？

- 当 size > threshold（capacity * loadFactor）时触发扩容
- 扩容后容量变为原来的 2 倍
- 扩容时需要重新计算所有元素的位置（JDK 1.8 有优化）

### 4. 为什么 HashMap 的容量必须是 2 的 n 次幂？

- 方便使用位运算代替取模运算，提高效率
- 使 hash 分布更均匀
- 便于扩容时的元素迁移

### 5. HashMap 的负载因子为什么是 0.75？

这是时间和空间的权衡：

- 太小：空间利用率低，频繁扩容
- 太大：哈希冲突增多，查询效率降低
- 0.75 是经过数学计算的最优值

### 6. HashMap 是线程安全的吗？

不是，HashMap 是非线程安全的。多线程环境下会存在：

- 数据丢失
- 数据覆盖
- JDK 1.7 可能出现死循环

### 7. HashMap 中 key 为 null 时怎么处理？

HashMap 允许一个 null 键，null 键的 hash 值为 0，存放在数组的第 0 个位置。

### 8. HashMap 和 ConcurrentHashMap 的区别？

| 特性 | HashMap | ConcurrentHashMap |
|------|---------|-------------------|
| 线程安全 | 否 | 是 |
| 实现方式 | 数组+链表+红黑树 | 数组+链表+红黑树 + CAS + synchronized |
| null 键值 | 允许 | 不允许 |
| 迭代器 | fail-fast | weakly consistent |

### 9. HashMap 和 Hashtable 的区别？

| 特性 | HashMap | Hashtable |
|------|---------|-----------|
| 线程安全 | 否 | 是 |
| null 键值 | 允许 | 不允许 |
| 继承 | AbstractMap | Dictionary |
| 效率 | 高 | 低 |

### 10. 如何优化 HashMap 的性能？

- 设置合适的初始容量，避免频繁扩容
- 选择合适的负载因子
- 使用不可变对象作为 key
- 重写 hashCode 和 equals 方法

## 十一、使用建议

### 11.1 初始化容量

如果知道大概的元素数量，可以设置初始容量：

```java
int expectedSize = 10000;
HashMap<String, String> map = new HashMap<>(expectedSize * 4 / 3 + 1);
```

### 11.2 选择合适的负载因子

默认 0.75 适用于大多数场景，如果：

- 内存紧张：可以增大负载因子（如 0.85）
- 查询性能要求高：可以减小负载因子（如 0.5）

### 11.3 避免大对象作为 key

大对象的 hashCode 计算成本高，建议使用：

- 基本类型包装类
- String
- 自定义的不可变对象

## 十二、总结

HashMap 是 Java 集合框架中最重要的类之一，其设计体现了以下思想：

1. **哈希表的精妙设计**：通过 hash 算法和位运算实现快速查找
2. **动态扩容机制**：平衡了时间和空间的效率
3. **红黑树优化**：解决了链表过长的问题
4. **位运算优化**：使用位运算代替取模，提高效率

理解 HashMap 的源码不仅有助于面试，更能帮助我们写出更高效的代码。
