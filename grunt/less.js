module.exports = function(grunt, options)
{
    return {
        dev : {
            files:
            {
                ".tmp/css/main.css" : "app/styles/main.less"
            }
        }
    }
};
