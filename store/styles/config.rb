# Get the directory that this configuration file exists in
dir = File.dirname(__FILE__)

# Compass configurations
sass_path = dir
css_path = File.join(dir, "../", "css")

# You can select your preferred output style here (can be overridden via the command line):
# output_style = :expanded or :nested or :compact or :compressed
output_style = :expanded

# Require any additional compass plugins here.
images_dir = File.join('', "..", "images")
environment = :development

# To enable relative paths to assets via compass helper functions. Uncomment:
relative_assets = true

# To disable debugging comments that display the original location of your selectors. Uncomment:
# line_comments = false


# If you prefer the indented syntax, you might want to regenerate this
# project again passing --syntax sass, or you can uncomment this:
# preferred_syntax = :sass
# and then run:
# sass-convert -R --from scss --to sass sass scss && rm -rf sass && mv scss sass

module Sass::Script::Functions
    def currTime()
        Sass::Script::String.new("%i" % Time.now.to_i)
    end
end
