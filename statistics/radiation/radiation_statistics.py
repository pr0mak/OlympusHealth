safe_user_rad_level =400
cautious_user_rad_level = 600
danger_user_rad_level =700


USER_RAD_LEVELS = {
    "SAFE":safe_user_rad_level,
    "CAUTION":cautious_user_rad_level,
    "DANGER": danger_user_rad_level,
}



area_sampling_rate = 24 * 60

# Unimplemented
def get_radiation_area(start : int,end : int ) -> [float]:
    # In mSV
    return [1.2,2.3,4.5]

# Unimplemented
def get_user_radiation(id : int,start :int  , end :int ) -> [float]:
    # In mSv
    pass

def append_user_radiation_data(value: float):
    pass

def append_area_radiation_data(value: float):
    pass
