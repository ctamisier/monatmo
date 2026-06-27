export function getModuleType(module) {
    return module?.type || module?.module_type || '';
}