import {GUI} from'three/addons/libs/lil-gui.module.min.js';

export function createUI(world){
    const gui=new GUI();
    gui.add(world.size,'width',8,100,1).name('Anchura');
    gui.add(world.size,'height',8,60,1).name('Altura');

       gui.add(world,'generate');
       
    
}
