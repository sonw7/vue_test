export function getcolorbylayer(layer,s) {
    let color;
    switch (layer) {
        case  0:
            //第四系
            if(s===0)
                color = '0xe5cf00';
            else
                color = '#e5cf00';
            //color = '#ffd700';
            break;
        case  1:
            //隔水层1
            if(s===0)
                color = '0x2a47e3';
            else
                color = '#2a47e3';
            break;
        case 2:
            //第四系底
            if(s===0)
                color = '0xFF0000';
            else
                color = '#ea3323';
            break;
        case  3:
            //隔水层2
            if(s==0)
                color = '0x2a47e3';
            else
                color = '#2a47e3';
            break;
        case  4:
            //石盒子
            if(s==0)
                color = '0x8500FF';
            else
                //color = '#8500FF';
                color = '#4fad5b';
            break;
        case  5:
            //隔水层3
            if(s==0)
                color = '0x00ffb0';
            else
                color = '#5fcf98';
            break;
        case  6:
            //大煤层
            if(s==0)
                color = '0xaf4c00';
            else
                color = '#4fad5b';
            break;
        case  7:
            //2煤
            if(s==0)
                color = '0xff1400';
            else
                color = '#ffffff';

            break;
        case  8:
            //隔水层4
            if(s==0)
                color = '0x008B8B';
            else
                color = '#5fcf98';
            break;
        case  9:
            //野青
            if(s==0)
                color = '0xff5c00';
            else
                color = '#68349a';
            break;
        case  10:
            //隔水层5
            if(s==0)
                color = '0x7a7500';
            else
                color = '#da7842';
            break;
        case  11:
            //5煤
            if(s==0)
                color = '0x8d00bc';
            else
                color = '#ffffff';
            break;
        case  12:
            //隔水层6
            if(s==0)
                color = '0xff00c4';
            else
                color = '#da7842';
            break;
        case  13:
            //伏青色
            if(s==0)
                color = '0xc1ec00';
            else
                color = '#68349a';
            break;
        case  14:
            //隔水层7
            if(s==0)
                color = '0x00b2ff';
            else
                color = '#5fcf98';
            break;
        case  15:
            //大青
            if(s==0)
                color = '0x806b00';
            else
                color = '#bfbfbf';
            break;
        case  16:
            //隔水层8
            if(s==0)
                color ='0x9b004d';
            else
                color = '#da7842';
            break;
        case  17:
            if(s==0)
                color = '0x4B0082';
            else
                color = '#4B0082';
            break;
        case  18:
            //9煤
            if(s==0)
                color = '0x777246';
            else
                color = '#ffffff';
            break;
        case  19:
            //隔水层9
            if(s==0)
                color = '0xdac617';
            else
                color = '#5fcf98';
            break;
        case 20:
            //本溪组
            if(s==0)
                color = '0xF08080';
            else
                color = '#bfbfbf';
            break;
        case 21:
            //隔水层10
            if(s==0)
                color = '0xFAFAD2';
            else
                color = '#da7842';
            break;
        case 22:
            //奥掏
            if(s==0)
                color ='0xffcc00';
            else
                color = '#68349a';
            break;
        case 23:
            //奥灰顶
            if(s==0)
                color = '0x48D1CC';
            else
                color = '#8574da';
            break;
        case 24:
            if(s==0)
                color = '0xcb8100';
            else
                color = '#cb8100';
            break;
        case 25:
            if(s==0)
                color = '0xFFA500';
            else
                color = '#FFA500';
            break;
        case 26:
            if(s==0)
                color = '0x4e008d';
            else
                color = '#4e008d';
            break;
        case 27:
            if(s==0)
                color = '0x0ec7e1';
            else
                color = '#0ec7e1';
            break;
        case 28:
            if(s==0)
                color = '0x008080';
            else
                color = '#008080';
            break;
        case 29:
            if(s==0)
                color = '0x4682B4';
            else
                color = '#4682B4';
            break;

        case 30:
            if(s==0)
                color = '0xBC8F8F';
            else
                color = '#BC8F8F';
            break;

        case  31:
            if(s==0)
                color = '0xFF0000';
            else
                color = '#45b1cb';
            break;
        case  32:
            if(s==0)
                color = '0xFF0000';
            else
                color = '#701685';
            break;
        case  33:
            if(s==0)
                color = '0xFF0000';
            else
                color = '#455e20';
            break;
        case  34:
            if(s==0)
                color = '0xFF0000';
            else
                color = '#367a62';
            break;
        case  35:
            if(s==0)
                color = '0xFF0000';
            else
                color = '#b9cc40';
            break;
        case  36:
            if(s==0)
                color = '0xFF0000';
            else
                color = '#dc6a6a';
            break;
        case  37:
            if(s==0)
                color = '0xFF0000';
            else
                color = '#74d5a1';
            break;
        case  38:
            if(s==0)
                color = '0xFF0000';
            else
                color = '#61e7d4';
            break;
        case  39:
            if(s==0)
                color = '0xFF0000';
            else
                color = '#8096f1';
            break;
        case  40:
            if(s==0)
                color = '0xFF0000';
            else
                color = '#af7fcb';
            break;
        case  41:
            if(s==0)
                color = '0xFF0000';
            else
                color = '#e54da7';
            break;
        case  42:
            if(s==0)
                color = '0xFF0000';
            else
                color = '#2fadda';
            break;
        case  43:
            if(s==0)
                color = '0xFF0000';
            else
                color = '#4d1786';
            break;
        case  44:
            if(s==0)
                color = '0xFF0000';
            else
                color = '#49f69a';
            break;
        case  45:
            if(s==0)
                color = '0xFF0000';
            else
                color = '#e08888';
            break;
        case  46:
            if(s==0)
                color = '0xFF0000';
            else
                color = '#e09029';
            break;
        case  47:
            if(s==0)
                color = '0xFF0000';
            else
                color = '#27e563';
            break;
        case  48:
            if(s==0)
                color = '0xe8438e';
            else
                color = '#e8438e';
            break;
        default:
            if(s==0)
                color = '0xffffff';
            else
                color = '#15b28e';
            break;
    }

    return color;

}
