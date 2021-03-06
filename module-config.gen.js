
/*********************************************************************
 * This file is automatically generated by mmir-plugins-export tools *
 *        Do not modify: ANY CHANGES WILL GET DISCARDED              *
 *********************************************************************/

module.exports = {
  pluginName: "speechio",
  config: [
    /**
     * the plugin type
     * @default "custom"
     */
    "type"
  ],
  defaultValues: {
    type: "custom"
  },
  buildConfigs: [
    {
      states: {
        models: {
          speechio: {
            moduleId: 'mmirf/speechioManager',
            mode: 'extended',
            file: __dirname + '/src/states/dialog.xml'
          }
        }
      }
    },
    {
      states: {
        models: {
          speechioInput: {
            moduleId: 'mmirf/speechioInput',
            mode: 'extended',
            file: __dirname + '/src/states/input.xml'
          }
        }
      }
    },
    {
      includeModules: ['mmirf/util/extendDeep']
    }
  ]
};
