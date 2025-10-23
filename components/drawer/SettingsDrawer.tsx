import { Drawer } from '@mui/material';
import classNames from 'classnames';
import { MenuItem } from 'components/common/MenuItem';
import { Icomoon } from 'components/icon/Icomoon';
import { openLink } from 'utils/commonUtils';
import { getContactList, getExternalLinkList } from 'utils/configUtils';

interface Props {
  open: boolean;
  onChangeOpen: (open: boolean) => void;
}

export const SettingsDrawer = (props: Props) => {
  const { open, onChangeOpen } = props;

  const getContactIcon = (type: string) => {
    return type.toLowerCase();
  };

  return (
    <Drawer
      anchor={'right'}
      open={open}
      onClose={() => onChangeOpen(false)}
      sx={{
        '& .MuiPaper-root': {
          background: '#F1F5F2',
          width: '4.85rem',
          paddingTop: '2.4rem',
        },
      }}
    >
      <div className="pb-[1rem] flex-1 flex flex-col justify-between items-stretch">
        <div>
          <div className="px-[.36rem]">
            <div className="ml-[.24rem]">
              {getExternalLinkList().map(
                (item: { name: string; link: string }) => (
                  <MenuItem
                    key={item.name}
                    mt=".36rem"
                    text={item.name}
                    link={item.link}
                  />
                )
              )}
            </div>
          </div>
        </div>

        <div className="pl-[.56rem] flex items-center">
          {getContactList().map(
            (item: { type: string; link: string }, index: number) => (
              <div
                key={item.type}
                className={classNames(
                  'cursor-pointer bg-white rounded-[.08rem] overflow-hidden',
                  index > 0 ? 'ml-[.4rem]' : ''
                )}
                onClick={() => {
                  openLink(item.link);
                }}
              >
                <Icomoon icon={getContactIcon(item.type)} size=".48rem" />
              </div>
            )
          )}
        </div>
      </div>
    </Drawer>
  );
};
