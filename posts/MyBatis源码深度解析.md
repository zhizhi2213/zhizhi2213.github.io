---
title: "MyBatis源码深度解析"
date: 2026-02-11 13:00:00
tags:
---
# MyBatis 源码深度解析

## 一、MyBatis 简介

MyBatis 是一款优秀的持久层框架，它支持定制化 SQL、存储过程以及高级映射。MyBatis 避免了几乎所有的 JDBC 代码和手动设置参数以及获取结果集的工作。MyBatis 可以使用简单的 XML 或注解来配置和映射原生信息，将接口和 Java 的 POJOs（Plain Old Java Objects，普通的 Java对象）映射成数据库中的记录。

### 核心特点

- 基于 SQL 映射的持久层框架
- 支持动态 SQL 语句
- 支持缓存机制
- 提供了与 Spring 的无缝集成
- 灵活的映射配置（XML 或注解）

## 二、MyBatis 核心架构

MyBatis 的核心架构由以下几个层次组成：

```
┌─────────────────────────────────────────┐
│         API Interface Layer             │
│  (SqlSession, Mapper Interface)         │
├─────────────────────────────────────────┤
│      Data Processing Layer              │
│  (ParameterHandler, ResultSetHandler)  │
├─────────────────────────────────────────┤
│       Statement Handling Layer          │
│      (StatementHandler, Executor)      │
├─────────────────────────────────────────┤
│       Core Supporting Layer             │
│  (Configuration, XMLConfigBuilder)      │
└─────────────────────────────────────────┘
```

### 2.1 核心组件

```java
public class Configuration {
    protected Environment environment;
    protected boolean safeRowBoundsEnabled;
    protected boolean safeResultHandlerEnabled;
    protected boolean mapUnderscoreToCamelCase;
    protected boolean aggressiveLazyLoading;
    protected boolean multipleResultSetsEnabled;
    protected boolean useGeneratedKeys;
    protected boolean useColumnLabel;
    protected boolean cacheEnabled;
    protected boolean callSettersOnNulls;
    
    protected Map<String, MappedStatement> mappedStatements = new StrictMap<MappedStatement>("Mapped Statements collection");
    protected Map<String, Cache> caches = new StrictMap<Cache>("Caches collection");
    protected Map<String, ResultMap> resultMaps = new StrictMap<ResultMap>("Result Maps collection");
    protected Map<String, ParameterMap> parameterMaps = new StrictMap<ParameterMap>("Parameter Maps collection");
    protected Map<String, KeyGenerator> keyGenerators = new StrictMap<KeyGenerator>("Key Generators collection");
    
    protected TypeHandlerRegistry typeHandlerRegistry = new TypeHandlerRegistry();
    protected TypeAliasRegistry typeAliasRegistry = new TypeAliasRegistry();
    protected ObjectFactory objectFactory = new DefaultObjectFactory();
    protected ObjectWrapperFactory objectWrapperFactory = new DefaultObjectWrapperFactory();
    protected ReflectorFactory reflectorFactory = new DefaultReflectorFactory();
}
```

## 三、MyBatis 初始化流程

### 3.1 整体初始化流程图

```
┌─────────────┐
│  加载配置文件  │
│ mybatis.xml │
└──────┬──────┘
       │
       ▼
┌──────────────────────┐
│   SqlSessionFactory  │
│    .Builder.build()  │
└──────┬───────────────┘
       │
       ▼
┌─────────────────────┐
│ XMLConfigBuilder    │
│   解析配置文件       │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ XMLMapperBuilder    │
│   解析映射文件       │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│   Configuration     │
│   (核心配置对象)     │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  DefaultSqlSession  │
│   Factory          │
└─────────────────────┘
```

### 3.2 初始化源码分析

#### 3.2.1 SqlSessionFactory 构建

```java
public class SqlSessionFactoryBuilder {
    
    public SqlSessionFactory build(InputStream inputStream) {
        return build(inputStream, null, null);
    }
    
    public SqlSessionFactory build(InputStream inputStream, String environment, Properties properties) {
        try {
            XMLConfigBuilder parser = new XMLConfigBuilder(inputStream, environment, properties);
            return build(parser.parse());
        } catch (Exception e) {
            throw ExceptionFactory.wrapException("Error building SqlSession.", e);
        } finally {
            ErrorContext.instance().reset();
            try {
                inputStream.close();
            } catch (IOException e) {
                // ignore
            }
        }
    }
    
    public SqlSessionFactory build(Configuration config) {
        return new DefaultSqlSessionFactory(config);
    }
}
```

#### 3.2.2 XMLConfigBuilder 解析配置

```java
public class XMLConfigBuilder extends BaseBuilder {
    
    private boolean parsed;
    private final XPathParser parser;
    private String environment;
    
    public Configuration parse() {
        if (parsed) {
            throw new BuilderException("Each XMLConfigBuilder can only be used once.");
        }
        parsed = true;
        parseConfiguration(parser.evalNode("/configuration"));
        return configuration;
    }
    
    private void parseConfiguration(XNode root) {
        try {
            propertiesElement(root.evalNode("properties"));
            settingsAsProperties(root.evalNode("settings"));
            typeAliasesElement(root.evalNode("typeAliases"));
            pluginElement(root.evalNode("plugins"));
            objectFactoryElement(root.evalNode("objectFactory"));
            objectWrapperFactoryElement(root.evalNode("objectWrapperFactory"));
            reflectorFactoryElement(root.evalNode("reflectorFactory"));
            settingsElement(settings);
            environmentsElement(root.evalNode("environments"));
            databaseIdProviderElement(root.evalNode("databaseIdProvider"));
            typeHandlerElement(root.evalNode("typeHandlers"));
            mapperElement(root.evalNode("mappers"));
        } catch (Exception e) {
            throw new BuilderException("Error parsing SQL Mapper Configuration. Cause: " + e, e);
        }
    }
}
```

#### 3.2.3 Mapper 解析

```java
public class XMLMapperBuilder extends BaseBuilder {
    
    public void parse() {
        if (!configuration.isResourceLoaded(resource)) {
            configurationElement(parser.evalNode("/mapper"));
            configuration.addLoadedResource(resource);
            bindMapperForNamespace();
        }
        parsePendingResultMaps();
        parsePendingCacheRefs();
        parsePendingStatements();
    }
    
    private void configurationElement(XNode context) {
        try {
            String namespace = context.getStringAttribute("namespace");
            if (namespace == null || namespace.isEmpty()) {
                throw new BuilderException("Mapper's namespace cannot be empty");
            }
            builderAssistant.setCurrentNamespace(namespace);
            cacheRefElement(context.evalNode("cache-ref"));
            cacheElement(context.evalNode("cache"));
            parameterMapElement(context.evalNodes("/mapper/parameterMap"));
            resultMapElements(context.evalNodes("/mapper/resultMap"));
            sqlElement(context.evalNodes("/mapper/sql"));
            buildStatementFromContext(context.evalNodes("select|insert|update|delete"));
        } catch (Exception e) {
            throw new BuilderException("Error parsing Mapper XML. Cause: " + e, e);
        }
    }
}
```

## 四、SQL 执行核心流程

### 4.1 SQL 执行完整流程图

```
┌──────────────┐
│  获取 Mapper  │
│   接口实例    │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ MapperProxy      │
│  (动态代理)       │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  MapperMethod    │
│  (方法封装)       │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  SqlSession      │
│  (会话管理)       │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Executor        │
│  (执行器)         │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ StatementHandler │
│  (语句处理)       │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  ParameterHandler│
│  (参数设置)       │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  ResultSet       │
│  Handler         │
│  (结果集处理)     │
└──────────────────┘
```

### 4.2 Mapper 动态代理机制

```java
public class MapperProxy<T> implements InvocationHandler {
    
    private final SqlSession sqlSession;
    private final Class<T> mapperInterface;
    private final Map<Method, MapperMethod> methodCache;
    
    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        try {
            if (Object.class.equals(method.getDeclaringClass())) {
                return method.invoke(this, args);
            } else if (isDefaultMethod(method)) {
                return invokeDefaultMethod(proxy, method, args);
            }
        } catch (Throwable t) {
            throw ExceptionUtil.unwrapThrowable(t);
        }
        final MapperMethod mapperMethod = cachedMapperMethod(method);
        return mapperMethod.execute(sqlSession, args);
    }
    
    private MapperMethod cachedMapperMethod(Method method) {
        MapperMethod mapperMethod = methodCache.get(method);
        if (mapperMethod == null) {
            mapperMethod = new MapperMethod(mapperInterface, method, sqlSession.getConfiguration());
            methodCache.put(method, mapperMethod);
        }
        return mapperMethod;
    }
}
```

### 4.3 MapperMethod 执行逻辑

```java
public class MapperMethod {
    
    private final SqlCommand command;
    private final MethodSignature method;
    
    public Object execute(SqlSession sqlSession, Object[] args) {
        Object result;
        switch (command.getType()) {
            case INSERT: {
                Object param = method.convertArgsToSqlCommandParam(args);
                result = rowCountResult(sqlSession.insert(command.getName(), param));
                break;
            }
            case UPDATE: {
                Object param = method.convertArgsToSqlCommandParam(args);
                result = rowCountResult(sqlSession.update(command.getName(), param));
                break;
            }
            case DELETE: {
                Object param = method.convertArgsToSqlCommandParam(args);
                result = rowCountResult(sqlSession.delete(command.getName(), param));
                break;
            }
            case SELECT:
                if (method.returnsVoid() && method.hasResultHandler()) {
                    executeWithResultHandler(sqlSession, args);
                    result = null;
                } else if (method.returnsMany()) {
                    result = executeForMany(sqlSession, args);
                } else if (method.returnsMap()) {
                    result = executeForMap(sqlSession, args);
                } else if (method.returnsCursor()) {
                    result = executeForCursor(sqlSession, args);
                } else {
                    Object param = method.convertArgsToSqlCommandParam(args);
                    result = sqlSession.selectOne(command.getName(), param);
                }
                break;
            case FLUSH:
                result = sqlSession.flushStatements();
                break;
            default:
                throw new BindingException("Unknown execution method for: " + command.getName());
        }
        if (result == null && method.getReturnType().isPrimitive() && !method.returnsVoid()) {
            throw new BindingException("Mapper method '" + command.getName() 
                + " attempted to return null from a method with a primitive return type (" + method.getReturnType() + ").");
        }
        return result;
    }
}
```

### 4.4 SqlSession 执行流程

```java
public class DefaultSqlSession implements SqlSession {
    
    private final Configuration configuration;
    private final Executor executor;
    
    @Override
    public <E> List<E> selectList(String statement, Object parameter, RowBounds rowBounds) {
        try {
            MappedStatement ms = configuration.getMappedStatement(statement);
            return executor.query(ms, wrapCollection(parameter), rowBounds, Executor.NO_RESULT_HANDLER);
        } catch (Exception e) {
            throw ExceptionFactory.wrapException("Error querying database. Cause: " + e, e);
        } finally {
            ErrorContext.instance().reset();
        }
    }
    
    @Override
    public <T> T selectOne(String statement, Object parameter) {
        List<T> list = this.<T>selectList(statement, parameter);
        if (list.size() == 1) {
            return list.get(0);
        } else if (list.size() > 1) {
            throw new TooManyResultsException("Expected one result (or null) to be returned by selectOne(), but found: " + list.size());
        } else {
            return null;
        }
    }
}
```

## 五、Executor 执行器

### 5.1 Executor 继承体系

```
        ┌──────────────┐
        │   Executor   │
        └──────┬───────┘
               │
       ┌───────┴────────┐
       │                │
┌──────▼──────┐  ┌─────▼──────────┐
│ BaseExecutor│  │ CachingExecutor│
└──────┬──────┘  └────────────────┘
       │
  ┌────┼────────┬────────┐
  │    │        │        │
┌─▼─┐┌─▼───┐┌──▼──┐┌───▼────┐
│Simple│Reuse│Batch│Closed│
│Executor│Executor│Executor│Executor│
└───┘└─────┘└─────┘└────────┘
```

### 5.2 BaseExecutor 核心实现

```java
public abstract class BaseExecutor implements Executor {
    
    protected Transaction transaction;
    protected Wrapper wrapper;
    protected ConcurrentLinkedQueue<DeferredLoad> deferredLoads;
    protected PerpetualCache localCache;
    protected PerpetualCache localOutputParameterCache;
    protected Configuration configuration;
    
    protected List<BatchResult> batchResults = new ArrayList<>();
    protected int queryStack = 0;
    
    @Override
    public <E> List<E> query(MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler) throws SQLException {
        BoundSql boundSql = ms.getBoundSql(parameter);
        CacheKey key = createCacheKey(ms, parameter, rowBounds, boundSql);
        return query(ms, parameter, rowBounds, resultHandler, key, boundSql);
    }
    
    @SuppressWarnings("unchecked")
    @Override
    public <E> List<E> query(MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler, CacheKey key, BoundSql boundSql) throws SQLException {
        ErrorContext.instance().resource(ms.getResource()).activity("executing a query").object(ms.getId());
        if (closed) {
            throw new ExecutorException("Executor was closed.");
        }
        if (queryStack == 0 && ms.isFlushCacheRequired()) {
            clearLocalCache();
        }
        List<E> list;
        try {
            queryStack++;
            list = resultHandler == null ? (List<E>) localCache.getObject(key) : null;
            if (list != null) {
                handleLocallyCachedOutputParameters(ms, key, parameter, boundSql);
            } else {
                list = queryFromDatabase(ms, parameter, rowBounds, resultHandler, key, boundSql);
            }
        } finally {
            queryStack--;
        }
        if (queryStack == 0) {
            for (DeferredLoad deferredLoad : deferredLoads) {
                deferredLoad.load();
            }
            deferredLoads.clear();
            if (configuration.getLocalCacheScope() == LocalCacheScope.STATEMENT) {
                clearLocalCache();
            }
        }
        return list;
    }
    
    private <E> List<E> queryFromDatabase(MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler, CacheKey key, BoundSql boundSql) throws SQLException {
        List<E> list;
        localCache.putObject(key, EXECUTION_PLACEHOLDER);
        try {
            list = doQuery(ms, parameter, rowBounds, resultHandler, boundSql);
        } finally {
            localCache.removeObject(key);
        }
        localCache.putObject(key, list);
        if (ms.getStatementType() == StatementType.CALLABLE) {
            localOutputParameterCache.putObject(key, parameter);
        }
        return list;
    }
    
    protected abstract <E> List<E> doQuery(MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler, BoundSql boundSql) throws SQLException;
}
```

### 5.3 SimpleExecutor 实现

```java
public class SimpleExecutor extends BaseExecutor {
    
    @Override
    public <E> List<E> doQuery(MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler, BoundSql boundSql) throws SQLException {
        Statement stmt = null;
        try {
            Configuration configuration = ms.getConfiguration();
            StatementHandler handler = configuration.newStatementHandler(wrapper, ms, parameter, rowBounds, resultHandler, boundSql);
            stmt = prepareStatement(handler, ms.getStatementLog());
            return handler.<E>query(stmt, resultHandler);
        } finally {
            closeStatement(stmt);
        }
    }
    
    private Statement prepareStatement(StatementHandler handler, Log statementLog) throws SQLException {
        Statement stmt;
        Connection connection = getConnection(statementLog);
        stmt = handler.prepare(connection, transaction.getTimeout());
        handler.parameterize(stmt);
        return stmt;
    }
}
```

## 六、StatementHandler 语句处理器

### 6.1 StatementHandler 继承体系

```
         ┌──────────────────┐
         │ StatementHandler│
         └────────┬─────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
┌───▼───┐   ┌───▼────┐   ┌───▼────┐
│Base   │   │Callable│   │Routing │
│Statement│ │Handler │ │Handler │
│Handler│   └────────┘   └────────┘
└───┬───┘
    │
┌───┼────────────┬──────────┐
│   │            │          │
┌▼─┐┌▼──────┐┌────▼───┐┌────▼────┐
│Simple│Prepare│Callable│Callable│
│Statement│dStatement│Handler │Handler │
│Handler│Handler│Handler │Handler │
└────┘└─────┘└────────┘└────────┘
```

### 6.2 PreparedStatementHandler 实现

```java
public class PreparedStatementHandler extends BaseStatementHandler {
    
    @Override
    public <E> List<E> query(Statement statement, ResultHandler resultHandler) throws SQLException {
        PreparedStatement ps = (PreparedStatement) statement;
        ps.execute();
        return resultSetHandler.<E>handleResultSets(ps);
    }
    
    @Override
    protected Statement instantiateStatement(Connection connection) throws SQLException {
        String sql = boundSql.getSql();
        if (mappedStatement.getKeyGenerator() instanceof Jdbc3KeyGenerator) {
            String[] keyColumnNames = mappedStatement.getKeyColumns();
            if (keyColumnNames == null) {
                return connection.prepareStatement(sql, PreparedStatement.RETURN_GENERATED_KEYS);
            } else {
                return connection.prepareStatement(sql, keyColumnNames);
            }
        } else if (mappedStatement.getResultSetType() != null) {
            return connection.prepareStatement(sql, mappedStatement.getResultSetType().getValue(), ResultSet.CONCUR_READ_ONLY);
        } else {
            return connection.prepareStatement(sql);
        }
    }
    
    @Override
    public void parameterize(Statement statement) throws SQLException {
        parameterHandler.setParameters((PreparedStatement) statement);
    }
}
```

### 6.3 ParameterHandler 参数处理器

```java
public interface ParameterHandler {
    Object getParameterObject();
    void setParameters(PreparedStatement ps) throws SQLException;
}

public class DefaultParameterHandler implements ParameterHandler {
    
    private final TypeHandlerRegistry typeHandlerRegistry;
    private final MappedStatement mappedStatement;
    private final Object parameterObject;
    private final BoundSql boundSql;
    private final Configuration configuration;
    
    @Override
    public void setParameters(PreparedStatement ps) {
        ErrorContext.instance().activity("setting parameters").object(mappedStatement.getParameterMap().getId());
        List<ParameterMapping> parameterMappings = boundSql.getParameterMappings();
        if (parameterMappings != null) {
            for (int i = 0; i < parameterMappings.size(); i++) {
                ParameterMapping parameterMapping = parameterMappings.get(i);
                if (parameterMapping.getMode() != ParameterMode.OUT) {
                    Object value;
                    String propertyName = parameterMapping.getProperty();
                    if (boundSql.hasAdditionalParameter(propertyName)) {
                        value = boundSql.getAdditionalParameter(propertyName);
                    } else if (parameterObject == null) {
                        value = null;
                    } else if (typeHandlerRegistry.hasTypeHandler(parameterObject.getClass())) {
                        value = parameterObject;
                    } else {
                        MetaObject metaObject = configuration.newMetaObject(parameterObject);
                        value = metaObject.getValue(propertyName);
                    }
                    TypeHandler typeHandler = parameterMapping.getTypeHandler();
                    JdbcType jdbcType = parameterMapping.getJdbcType();
                    if (value == null && jdbcType == null) {
                        jdbcType = configuration.getJdbcTypeForNull();
                    }
                    try {
                        typeHandler.setParameter(ps, i + 1, value, jdbcType);
                    } catch (TypeException e) {
                        throw new TypeException("Could not set parameters for mapping: " + parameterMapping + ". Cause: " + e, e);
                    } catch (SQLException e) {
                        throw new TypeException("Could not set parameters for mapping: " + parameterMapping + ". Cause: " + e, e);
                    }
                }
            }
        }
    }
}
```

### 6.4 ResultSetHandler 结果集处理器

```java
public interface ResultSetHandler {
    <E> List<E> handleResultSets(Statement stmt) throws SQLException;
    <E> Cursor<E> handleCursorResultSets(Statement stmt) throws SQLException;
    void handleOutputParameters(CallableStatement cs) throws SQLException;
}

public class DefaultResultSetHandler implements ResultSetHandler {
    
    @Override
    public List<Object> handleResultSets(Statement stmt) throws SQLException {
        ErrorContext.instance().activity("handling results").object(mappedStatement.getId());
        
        final List<Object> multipleResults = new ArrayList<>();
        int resultSetCount = 0;
        ResultSetWrapper rsw = getFirstResultSet(stmt);
        
        List<ResultMap> resultMaps = mappedStatement.getResultMaps();
        int resultMapCount = resultMaps.size();
        validateResultMapsCount(rsw, resultMapCount);
        
        while (rsw != null && resultMapCount > resultSetCount) {
            ResultMap resultMap = resultMaps.get(resultSetCount);
            handleResultSet(rsw, resultMap, multipleResults, null);
            rsw = getNextResultSet(stmt);
            cleanUpAfterHandlingResultSet();
            resultSetCount++;
        }
        
        String[] resultSets = mappedStatement.getResultSets();
        if (resultSets != null) {
            while (rsw != null && resultSetCount < resultSets.length) {
                ResultMapping parentMapping = nextResultMaps.get(resultSets[resultSetCount]);
                if (parentMapping != null) {
                    String nestedResultMapId = parentMapping.getNestedResultMapId();
                    ResultMap resultMap = configuration.getResultMap(nestedResultMapId);
                    handleResultSet(rsw, resultMap, null, parentMapping);
                }
                rsw = getNextResultSet(stmt);
                cleanUpAfterHandlingResultSet();
                resultSetCount++;
            }
        }
        
        return collapseSingleResultList(multipleResults);
    }
    
    private void handleResultSet(ResultSetWrapper rsw, ResultMap resultMap, List<Object> multipleResults, ResultMapping parentMapping) throws SQLException {
        try {
            if (parentMapping != null) {
                handleRowValuesForNestedResultMap(rsw, resultMap, null, parentMapping);
            } else {
                if (resultHandler == null) {
                    handleRowValuesForDefaultResultMap(rsw, resultMap, multipleResults, null);
                } else {
                    handleRowValuesForSimpleResultMap(rsw, resultMap, resultHandler, null, null);
                }
            }
        } finally {
            closeResultSet(rsw.getResultSet());
        }
    }
}
```

## 七、缓存机制

### 7.1 MyBatis 缓存结构

```
┌─────────────────────────────────┐
│      Cache 接口                 │
└────────────┬────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
┌───▼─────┐    ┌────▼──────┐
│Perpetual│    │  Blocking │
│Cache    │    │Cache      │
└─────────┘    └───────────┘
    │
    │
┌───▼───────────────────────┐
│    装饰器模式                │
│  LruCache / FifoCache     │
│  SoftCache / WeakCache     │
│  LoggingCache / SyncCache  │
└───────────────────────────┘
```

### 7.2 缓存实现

```java
public class PerpetualCache implements Cache {
    
    private final String id;
    private Map<Object, Object> cache = new HashMap<>();
    
    public PerpetualCache(String id) {
        this.id = id;
    }
    
    @Override
    public String getId() {
        return id;
    }
    
    @Override
    public int getSize() {
        return cache.size();
    }
    
    @Override
    public void putObject(Object key, Object value) {
        cache.put(key, value);
    }
    
    @Override
    public Object getObject(Object key) {
        return cache.get(key);
    }
    
    @Override
    public Object removeObject(Object key) {
        return cache.remove(key);
    }
    
    @Override
    public void clear() {
        cache.clear();
    }
}
```

## 八、动态 SQL 机制

### 8.1 动态 SQL 执行流程

```
┌──────────────────┐
│  解析 XML        │
│  动态 SQL 标签   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  SqlSource       │
│  (SQL 源)        │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  DynamicContext  │
│  (动态上下文)     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  SqlNode         │
│  (SQL 节点)       │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  BoundSql        │
│  (绑定 SQL)      │
└──────────────────┘
```

### 8.2 SqlNode 实现

```java
public interface SqlNode {
    boolean apply(DynamicContext context);
}

public class IfSqlNode implements SqlNode {
    
    private final ExpressionEvaluator evaluator;
    private final String test;
    private final SqlNode contents;
    
    public IfSqlNode(SqlNode contents, String test) {
        this.test = test;
        this.contents = contents;
        this.evaluator = new ExpressionEvaluator();
    }
    
    @Override
    public boolean apply(DynamicContext context) {
        if (evaluator.evaluateBoolean(test, context.getBindings())) {
            contents.apply(context);
            return true;
        }
        return false;
    }
}

public class ForEachSqlNode implements SqlNode {
    
    public static final String ITEM_PREFIX = "__frch_";
    
    private final ExpressionEvaluator evaluator;
    private final String collectionExpression;
    private final SqlNode contents;
    private final String open;
    private final String close;
    private final String separator;
    private final String item;
    private final String index;
    private final String itemName;
    private final String indexName;
    
    @Override
    public boolean apply(DynamicContext context) {
        Map<String, Object> bindings = context.getBindings();
        final Iterable<?> iterable = evaluator.evaluateIterable(collectionExpression, bindings);
        if (!iterable.iterator().hasNext()) {
            return true;
        }
        boolean first = true;
        applyOpen(context);
        int i = 0;
        for (Object o : iterable) {
            DynamicContext oldContext = context;
            if (first) {
                first = false;
            } else {
                applySeparator(context);
            }
            applyItem(context, o, i);
            contents.apply(new FilteredDynamicContext(oldContext, index, item, i));
            i++;
        }
        applyClose(context);
        return true;
    }
}
```

## 九、插件机制

### 9.1 拦截器链

```java
public interface Interceptor {
    Object intercept(Invocation invocation) throws Throwable;
    Object plugin(Object target);
    void setProperties(Properties properties);
}

public class InterceptorChain {
    
    private final List<Interceptor> interceptors = new ArrayList<>();
    
    public Object pluginAll(Object target) {
        for (Interceptor interceptor : interceptors) {
            target = interceptor.plugin(target);
        }
        return target;
    }
    
    public void addInterceptor(Interceptor interceptor) {
        interceptors.add(interceptor);
    }
    
    public List<Interceptor> getInterceptors() {
        return Collections.unmodifiableList(interceptors);
    }
}

public class Plugin implements InvocationHandler {
    
    private final Object target;
    private final Interceptor interceptor;
    private final Map<Class<?>, Set<Method>> signatureMap;
    
    private Plugin(Object target, Interceptor interceptor, Map<Class<?>, Set<Method>> signatureMap) {
        this.target = target;
        this.interceptor = interceptor;
        this.signatureMap = signatureMap;
    }
    
    public static Object wrap(Object target, Interceptor interceptor) {
        Map<Class<?>, Set<Method>> signatureMap = getSignatureMap(interceptor);
        Class<?> type = target.getClass();
        Class<?>[] interfaces = getAllInterfaces(type, signatureMap);
        if (interfaces.length > 0) {
            return Proxy.newProxyInstance(
                type.getClassLoader(),
                interfaces,
                new Plugin(target, interceptor, signatureMap));
        }
        return target;
    }
    
    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        try {
            Set<Method> methods = signatureMap.get(method.getDeclaringClass());
            if (methods != null && methods.contains(method)) {
                return interceptor.intercept(new Invocation(target, method, args));
            }
            return method.invoke(target, args);
        } catch (Exception e) {
            throw ExceptionUtil.unwrapThrowable(e);
        }
    }
}
```

## 十、总结

### 10.1 MyBatis 核心流程总结

1. **初始化阶段**：
   - 解析配置文件（XMLConfigBuilder）
   - 解析 Mapper 文件（XMLMapperBuilder）
   - 构建 Configuration 对象
   - 创建 SqlSessionFactory

2. **执行阶段**：
   - 通过 MapperProxy 动态代理执行方法
   - MapperMethod 封装方法调用
   - SqlSession 管理会话
   - Executor 执行 SQL
   - StatementHandler 处理语句
   - ParameterHandler 设置参数
   - ResultSetHandler 处理结果集

3. **扩展机制**：
   - 插件机制（Interceptor + Plugin）
   - 缓存机制（Cache 接口 + 装饰器）
   - 动态 SQL（SqlNode + DynamicContext）

### 10.2 设计模式总结

| 设计模式 | 应用场景 | 典型类 |
|---------|---------|--------|
| 工厂模式 | 创建 SqlSessionFactory | SqlSessionFactoryBuilder |
| 建造者模式 | 构建复杂对象 | XMLConfigBuilder, XMLMapperBuilder |
| 代理模式 | Mapper 接口代理 | MapperProxy |
| 策略模式 | 不同的执行器 | SimpleExecutor, ReuseExecutor, BatchExecutor |
| 装饰器模式 | 缓存功能增强 | LruCache, FifoCache |
| 模板方法模式 | 执行器基类 | BaseExecutor |
| 责任链模式 | 插件拦截 | InterceptorChain |

### 10.3 学习建议

1. 从简单示例入手，理解基本用法
2. 重点理解初始化流程和执行流程
3. 深入研究动态 SQL 的实现机制
4. 学习插件机制和缓存机制
5. 结合源码调试，加深理解

通过本文的学习，你应该能够：
- 理解 MyBatis 的整体架构和核心组件
- 掌握 MyBatis 的初始化和执行流程
- 了解动态 SQL、缓存、插件等核心机制的实现原理
- 具备阅读和深入 MyBatis 源码的能力
