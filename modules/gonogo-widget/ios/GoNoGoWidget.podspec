Pod::Spec.new do |s|
  s.name           = 'GoNoGoWidget'
  s.version        = '1.0.0'
  s.summary        = 'Go/No-Go home screen widget bridge for DronePal'
  s.description    = 'Writes the current Go/No-Go status to the shared App Group and reloads the WidgetKit timeline.'
  s.author         = 'DronePal'
  s.homepage       = 'https://dronepal.app'
  s.license        = { type: 'MIT' }
  s.platforms      = { ios: '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = '**/*.{h,m,swift}'
end
