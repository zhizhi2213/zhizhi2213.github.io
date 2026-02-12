---
title: "Spring源码中的设计模式详解"
date: 2026-02-09 20:00:00
tags: [设计模式, Spring, Java]
---

# Spring源码中的设计模式详解

Spring框架作为Java开发中最流行的框架之一，其优雅的架构设计离不开对设计模式的巧妙运用。本文将结合Spring源码，重点讲解代理模式、适配器模式、装饰器模式和工厂模式在Spring中的应用。

## 什么是设计模式？

设计模式是一套被反复使用、多数人知晓的、经过分类编目的、代码设计经验的总结。使用设计模式是为了可重用代码、让代码更容易被他人理解、保证代码可靠性。

## 1. 代理模式（Proxy Pattern）

### 什么是代理模式？

代理模式为其他对象提供一种代理以控制对这个对象的访问。在某些情况下，一个对象不适合或者不能直接引用另一个对象，而代理对象可以在客户端和目标对象之间起到中介的作用。

### Spring中的应用

Spring中最经典的代理模式应用就是**AOP（面向切面编程）**的实现。

#### 动态代理示例

Spring AOP主要通过两种方式实现动态代理：

1. **JDK动态代理**（基于接口）
2. **CGLIB代理**（基于类）

Spring源码中的关键类：
- `org.springframework.aop.framework.JdkDynamicAopProxy`
- `org.springframework.aop.framework.CglibAopProxy`

```java
// Spring源码中的Jdk动态代理实现片段
public class JdkDynamicAopProxy implements AopProxy, InvocationHandler, Serializable {

    private final AdvisedSupport advised;

    public JdkDynamicAopProxy(AdvisedSupport config) {
        this.advised = config;
    }

    @Override
    public Object getProxy() {
        return getProxy(ClassUtils.getDefaultClassLoader());
    }

    @Override
    public Object getProxy(ClassLoader classLoader) {
        return Proxy.newProxyInstance(classLoader, 
            this.advised.getTargetClass().getInterfaces(), 
            this);
    }

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        MethodInvocation invocation = null;
        Object oldProxy = null;
        boolean setProxyContext = false;

        TargetSource targetSource = this.advised.targetSource;
        Class<?> targetClass = null;
        Object target = null;

        try {
            // 执行目标方法
            return retVal;
        } finally {
            // 清理工作
        }
    }
}
```

#### 实际应用场景

```java
@Service
public class UserServiceImpl implements UserService {

    @Override
    public void saveUser(User user) {
        System.out.println("保存用户: " + user.getName());
    }

    @Override
    public void deleteUser(Long userId) {
        System.out.println("删除用户: " + userId);
    }
}

// 使用Spring AOP添加日志切面
@Aspect
@Component
public class LoggingAspect {

    @Before("execution(* com.example.service.*.*(..))")
    public void logBefore(JoinPoint joinPoint) {
        System.out.println("执行方法: " + joinPoint.getSignature().getName());
    }

    @After("execution(* com.example.service.*.*(..))")
    public void logAfter(JoinPoint joinPoint) {
        System.out.println("方法执行完毕: " + joinPoint.getSignature().getName());
    }
}
```

### 代理模式的优势

1. **职责清晰**：真实角色只需关注业务逻辑
2. **高扩展性**：代理对象可以在不修改真实对象的情况下增加额外功能
3. **智能化**：动态代理可以在运行时决定调用哪个对象

## 2. 适配器模式（Adapter Pattern）

### 什么是适配器模式？

适配器模式将一个类的接口转换成客户希望的另外一个接口，使得原本由于接口不兼容而不能一起工作的那些类可以一起工作。

### Spring中的应用

Spring中适配器模式的应用非常广泛，主要体现在以下几个方面：

#### 2.1 Spring MVC中的适配器

在Spring MVC中，不同的Controller类型（如注解@Controller、实现Controller接口、HttpRequestHandler等）通过适配器模式统一处理。

关键类：
- `org.springframework.web.servlet.HandlerAdapter`
- `org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerAdapter`
- `org.springframework.web.servlet.mvc.HttpRequestHandlerAdapter`

```java
// HandlerAdapter接口定义
public interface HandlerAdapter {

    boolean supports(Object handler);

    ModelAndView handle(HttpServletRequest request, 
                        HttpServletResponse response, 
                        Object handler) throws Exception;

    long getLastModified(HttpServletRequest request, Object handler);
}

// RequestMappingHandlerAdapter实现
public class RequestMappingHandlerAdapter extends AbstractHandlerMethodAdapter
        implements BeanFactoryAware, InitializingBean {

    @Override
    protected boolean supportsInternal(HandlerMethod handlerMethod) {
        return true;
    }

    @Override
    protected ModelAndView handleInternal(HttpServletRequest request,
                                          HttpServletResponse response,
                                          HandlerMethod handlerMethod) throws Exception {
        // 处理注解类型的Controller
        return invokeHandlerMethod(request, response, handlerMethod);
    }
}

// HttpRequestHandlerAdapter实现
public class HttpRequestHandlerAdapter implements HandlerAdapter {

    @Override
    public boolean supports(Object handler) {
        return (handler instanceof HttpRequestHandler);
    }

    @Override
    public ModelAndView handle(HttpServletRequest request,
                               HttpServletResponse response,
                               Object handler) throws Exception {
        ((HttpRequestHandler) handler).handleRequest(request, response);
        return null;
    }
}
```

#### 2.2 Spring AOP中的适配器

Spring AOP通过适配器模式将不同的Advice（通知）类型适配到统一的拦截器链中。

关键类：
- `org.springframework.aop.framework.adapter.AdvisorAdapter`
- `org.springframework.aop.framework.adapter.MethodBeforeAdviceAdapter`
- `org.springframework.aop.framework.adapter.AfterReturningAdviceAdapter`

```java
// AdvisorAdapter接口
public interface AdvisorAdapter {

    boolean supportsAdvice(Advice advice);

    MethodInterceptor getInterceptor(Advisor advisor);
}

// MethodBeforeAdviceAdapter实现
public class MethodBeforeAdviceAdapter implements AdvisorAdapter, Serializable {

    @Override
    public boolean supportsAdvice(Advice advice) {
        return (advice instanceof MethodBeforeAdvice);
    }

    @Override
    public MethodInterceptor getInterceptor(Advisor advisor) {
        MethodBeforeAdvice advice = (MethodBeforeAdvice) advisor.getAdvice();
        return new MethodBeforeAdviceInterceptor(advice);
    }
}

// 适配器实现
class MethodBeforeAdviceInterceptor implements MethodInterceptor, Serializable {

    private final MethodBeforeAdvice advice;

    public MethodBeforeAdviceInterceptor(MethodBeforeAdvice advice) {
        this.advice = advice;
    }

    @Override
    public Object invoke(MethodInvocation mi) throws Throwable {
        // 在目标方法执行前执行
        this.advice.before(mi.getMethod(), mi.getArguments(), mi.getThis());
        return mi.proceed();
    }
}
```

### 适配器模式的优势

1. **解耦**：将接口转换逻辑独立出来，不修改原有代码
2. **复用**：提高了类的复用性
3. **灵活**：可以灵活地添加新的适配器

## 3. 装饰器模式（Decorator Pattern）

### 什么是装饰器模式？

装饰器模式动态地给一个对象添加一些额外的职责。就增加功能来说，装饰器模式相比生成子类更为灵活。

### Spring中的应用

Spring中装饰器模式的典型应用是在Bean的生命周期管理和资源处理中。

#### 3.1 BeanWrapper的装饰

`BeanWrapper`是Spring中用于操作Bean属性的强大工具，它通过装饰器模式增强了基本的属性访问功能。

关键类：
- `org.springframework.beans.BeanWrapper`
- `org.springframework.beans.BeanWrapperImpl`

```java
public class BeanWrapperImpl implements BeanWrapper {

    private Object wrappedObject;
    private BeanWrapper nestedBeanWrapper;

    public BeanWrapperImpl(Object wrappedObject) {
        this.wrappedObject = wrappedObject;
    }

    @Override
    public Object getWrappedInstance() {
        return this.wrappedObject;
    }

    @Override
    public Class<?> getWrappedClass() {
        return (this.wrappedObject != null ? this.wrappedObject.getClass() : null);
    }

    @Override
    public void setPropertyValue(String propertyName, Object value) 
            throws BeansException {
        // 装饰：添加类型转换、验证等功能
        BeanValueHolder valueHolder = new BeanValueHolder(propertyName, value);
        PropertyValue pv = new PropertyValue(propertyName, valueHolder);
        setPropertyValue(pv);
    }

    @Override
    public Object getPropertyValue(String propertyName) 
            throws BeansException {
        // 装饰：添加缓存、类型转换等功能
        PropertyTokenHolder tokens = getPropertyNameTokens(propertyName);
        return getPropertyValue(tokens);
    }
}
```

#### 3.2 HttpServletResponseWrapper的装饰

在Spring MVC中，通过装饰器模式包装原生HttpServletResponse对象。

```java
public class HttpServletResponseWrapper extends ServletResponseWrapper 
        implements HttpServletResponse {

    private HttpServletResponse response;

    public HttpServletResponseWrapper(HttpServletResponse response) {
        super(response);
        this.response = response;
    }

    @Override
    public void addCookie(Cookie cookie) {
        this.response.addCookie(cookie);
    }

    @Override
    public String encodeURL(String url) {
        return this.response.encodeURL(url);
    }

    // 可以在这里添加额外的装饰功能
    public void setCustomHeader(String name, String value) {
        this.response.setHeader(name, value);
    }
}
```

### 装饰器模式的优势

1. **灵活扩展**：可以在运行时动态地添加或撤销功能
2. **避免类爆炸**：相比继承，装饰器模式可以避免产生大量子类
3. **单一职责**：每个装饰器只关注一个特定的功能

## 4. 工厂模式（Factory Pattern）

### 什么是工厂模式？

工厂模式提供了一种创建对象的最佳方式，在创建对象时不会对客户端暴露创建逻辑，并且是通过使用一个共同的接口来指向新创建的对象。

### Spring中的应用

Spring框架本身就是一个大型的工厂，**IoC容器**就是工厂模式的典型应用。

#### 4.1 BeanFactory（简单工厂+工厂方法）

`BeanFactory`是Spring容器的核心接口，负责管理和配置Bean。

关键类：
- `org.springframework.beans.factory.BeanFactory`
- `org.springframework.beans.factory.xml.XmlBeanFactory`
- `org.springframework.beans.factory.support.DefaultListableBeanFactory`

```java
// BeanFactory接口
public interface BeanFactory {

    String FACTORY_BEAN_PREFIX = "&";

    Object getBean(String name) throws BeansException;

    <T> T getBean(String name, Class<T> requiredType) throws BeansException;

    <T> T getBean(Class<T> requiredType) throws BeansException;

    Object getBean(String name, Object... args) throws BeansException;

    boolean containsBean(String name);

    boolean isSingleton(String name) throws NoSuchBeanDefinitionException;

    boolean isPrototype(String name) throws NoSuchBeanDefinitionException;

    boolean isTypeMatch(String name, ResolvableType typeToMatch);

    boolean isTypeMatch(String name, Class<?> typeToMatch) 
            throws NoSuchBeanDefinitionException;

    Class<?> getType(String name) throws NoSuchBeanDefinitionException;

    String[] getAliases(String name);
}

// DefaultListableBeanFactory实现
public class DefaultListableBeanFactory extends AbstractAutowireCapableBeanFactory
        implements ConfigurableListableBeanFactory, BeanDefinitionRegistry {

    private final Map<String, BeanDefinition> beanDefinitionMap = new ConcurrentHashMap<>(256);

    @Override
    public Object getBean(String name) throws BeansException {
        return doGetBean(name, null, null, false);
    }

    protected <T> T doGetBean(String name, @Nullable Class<T> requiredType,
                             @Nullable Object[] args, boolean typeCheckOnly) 
            throws BeansException {

        // 1. 检查缓存中是否有实例化的单例Bean
        Object beanInstance = getSingleton(beanName);

        if (beanInstance != null) {
            return (T) beanInstance;
        }

        // 2. 获取BeanDefinition
        RootBeanDefinition mbd = getMergedLocalBeanDefinition(beanName);

        // 3. 创建Bean实例
        beanInstance = createBean(beanName, mbd, args);

        return (T) beanInstance;
    }

    @Override
    public void registerBeanDefinition(String beanName, BeanDefinition beanDefinition) {
        this.beanDefinitionMap.put(beanName, beanDefinition);
    }
}
```

#### 4.2 ApplicationContext（抽象工厂）

`ApplicationContext`是`BeanFactory`的扩展，提供了更多企业级特性。

```java
// ApplicationContext接口
public interface ApplicationContext extends EnvironmentCapable, 
        ListableBeanFactory, HierarchicalBeanFactory,
        MessageSource, ApplicationEventPublisher, ResourcePatternResolver {

    String getId();

    String getApplicationName();

    String getDisplayName();

    long getStartupDate();

    ApplicationContext getParent();

    AutowireCapableBeanFactory getAutowireCapableBeanFactory();
}

// ClassPathXmlApplicationContext实现
public class ClassPathXmlApplicationContext extends AbstractXmlApplicationContext {

    public ClassPathXmlApplicationContext(String configLocation) throws BeansException {
        this(new String[] {configLocation}, true, null);
    }

    public ClassPathXmlApplicationContext(String[] configLocations, 
                                          boolean refresh, 
                                          @Nullable ApplicationContext parent)
            throws BeansException {
        super(parent);
        setConfigLocations(configLocations);
        if (refresh) {
            refresh();
        }
    }

    @Override
    protected Resource[] getConfigResources() {
        return this.configLocations;
    }
}
```

#### 4.3 FactoryBean（工厂Bean）

`FactoryBean`是Spring中特殊的工厂Bean接口，用于创建复杂对象。

```java
// FactoryBean接口
public interface FactoryBean<T> {

    String OBJECT_TYPE_ATTRIBUTE = "factoryBeanObjectType";

    @Nullable
    T getObject() throws Exception;

    @Nullable
    Class<?> getObjectType();

    default boolean isSingleton() {
        return true;
    }
}

// 示例：使用FactoryBean创建复杂对象
public class ConnectionFactoryBean implements FactoryBean<Connection> {

    private String url;
    private String username;
    private String password;

    public void setUrl(String url) {
        this.url = url;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    @Override
    public Connection getObject() throws Exception {
        DriverManager.getConnection(url, username, password);
    }

    @Override
    public Class<?> getObjectType() {
        return Connection.class;
    }

    @Override
    public boolean isSingleton() {
        return false;
    }
}
```

配置文件中使用：
```xml
<bean id="connection" class="com.example.ConnectionFactoryBean">
    <property name="url" value="jdbc:mysql://localhost:3306/test"/>
    <property name="username" value="root"/>
    <property name="password" value="123456"/>
</bean>
```

### 工厂模式的优势

1. **解耦**：将对象的创建和使用分离
2. **灵活**：可以方便地切换不同的实现
3. **统一管理**：集中管理对象的创建逻辑
4. **可扩展**：容易扩展新的产品类型

## 总结

Spring框架通过对设计模式的巧妙运用，实现了高度的可扩展性和灵活性：

| 设计模式 | Spring应用场景 | 核心类 |
|---------|--------------|--------|
| 代理模式 | AOP实现、事务管理 | JdkDynamicAopProxy、CglibAopProxy |
| 适配器模式 | MVC Handler适配、AOP Advice适配 | HandlerAdapter、AdvisorAdapter |
| 装饰器模式 | BeanWrapper、HttpServletResponseWrapper | BeanWrapperImpl、HttpServletResponseWrapper |
| 工厂模式 | IoC容器、Bean创建 | BeanFactory、ApplicationContext、FactoryBean |

学习Spring源码中的设计模式应用，不仅能帮助我们更好地理解Spring框架的工作原理，更能提升我们自身的代码设计能力。在实际开发中，我们应该根据具体场景选择合适的设计模式，避免过度设计。

## 参考资源

- Spring Framework官方文档
- 《Spring源码深度解析》
- 《设计模式：可复用面向对象软件的基础》
