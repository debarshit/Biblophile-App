const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withIosDeploymentTarget = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let podfileContent = fs.readFileSync(podfilePath, 'utf8');

      const injection = `
    # Force minimum iOS deployment target and allow non-modular includes across all Pod targets and resource bundles
    installer.pods_project.build_configurations.each do |config|
      config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
    end
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        current_target = config.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
        if current_target.nil? || current_target.to_f < 15.1
          config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.1'
        end
        config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
      end
    end
    if installer.respond_to?(:target_installation_results) && installer.target_installation_results.respond_to?(:pod_target_installation_results)
      installer.target_installation_results.pod_target_installation_results.each do |pod_name, target_installation_result|
        target_installation_result.resource_bundle_targets.each do |resource_bundle_target|
          resource_bundle_target.build_configurations.each do |config|
            config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.1'
            config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
          end
        end
      end
    end
`;

      if (podfileContent.includes('post_install do |installer|')) {
        podfileContent = podfileContent.replace(
          'post_install do |installer|',
          `post_install do |installer|\n${injection}`
        );
      } else {
        podfileContent += `
post_install do |installer|
${injection}
end
`;
      }

      fs.writeFileSync(podfilePath, podfileContent, 'utf8');
      return config;
    },
  ]);
};

module.exports = withIosDeploymentTarget;