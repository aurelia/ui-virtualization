import { Aurelia, PLATFORM } from 'aurelia-framework';

declare const PRODUCTION: boolean;

export async function configure(aurelia: Aurelia) {
  try {
    aurelia.use
      .standardConfiguration()
      .plugin(PLATFORM.moduleName('aurelia-ui-virtualization'))
      .globalResources([
        class {
          static $resource = {
            type: 'valueConverter',
            name: 'identity'
          };

          toView(val: any) {
            return val;
          }
        }
      ] as any[]);

    if (!PRODUCTION) {
      aurelia.use.developmentLogging();
    }

    await aurelia.start();
    await aurelia.setRoot(PLATFORM.moduleName('app'));
  } catch (ex) {
    document.body.textContent = ex;
  }
}
